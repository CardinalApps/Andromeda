/**
 * @module Query
 */
export default class Query {
  /**
   * Constructor.
   *
   * @param {string} givenQueryObj.table - The table name, without the prefix.
   *
   * @param {string} [givenQueryObj.prefix] - If the database uses a table name
   * prefix, it can be set here. All table names in all parts of the query do
   * not require the prefix if it's set here. Defaults to `server_` for
   * [Cardinal](https://cardinalapps.xyz) purposes
   *
   * @param {string} [givenQueryObj.itemsPerPage] - Defaults to 100. Set to -1
   * for no limit per page, which puts all results on page 1.
   *
   * @param {string} [givenQueryObj.columns] - An object of `column: value`
   * pairs that must exactly match the  database contents. Values can be a
   * string, number, or array. Or, an array of such objects. When performing a
   * join, you can set the table name in the column name like `artists.id` to
   * handle column name collisions. You may provide an "equalityOperator" key on
   * a per-column-object basis so that queries of multiple compares can be
   * combined (ie. get all artists except *these*)..
   *
   * @param {string} [givenQueryObj.columnCompare] - Operator used when querying
   * for multiple columns. Either `AND` or `OR`. Defaults to `AND`.
   *
   * @param {string} [givenQueryObj.equalityOperator] - Operator used when
   * checking the value of the column. Can be `=`, `LIKE`, `IN`, or `NOT IN`.
   * Defaults to `=`. When using `LIKE`, you must put `%` signs around your
   * string.
   *
   * @param {string} [givenQueryObj.orderBy] - Optionally order the results. Use
   * an array of single entry objects of `column: order` key-value pairs. Orders
   * are `ASC` and `DESC`. When omitted, the results are returned in the order
   * that they exist in the database. This can also be set to the `rand` for
   * random order.
   *
   * @param {string} [givenQueryObj.page] - Initial page to load. Defaults to
   * page 1. Use `goToPage()` to switch pages afterwards.
   *
   * @param {string} [givenQueryObj.join] - An object that performs a table
   * join, or an array of such objects.
   *
   * @param {string} givenQueryObj.join.table - Required. The table name to
   * join, without prefix.
   *
   * @param {string} givenQueryObj.join.on - An object of
   * `PrimaryTableColumn:ForeignTableColumn` keys and values that produce the ON
   * statement.
   *
   * @param {string} [givenQueryObj.join.equalityOperator] - Equality operator
   * when comparing primary to foreign values.
   *
   * @param {string} [givenQueryObj.join.type] - Either `LEFT JOIN`, `INNER
   * JOIN`, or `CROSS JOIN`. Defaults to `LEFT JOIN`.
   *
   * @param {string} [givenQueryObj.mode] - For
   * [Cardinal](https://cardinalapps.xyz) purposes. Either `http` or `ipc`.
   * Defaults to `http`. See [README.me#Setting the
   * Endpoint](#setting-the-endpoint).
   */
  constructor(givenQueryObj) {
    return (async () => {
      // required query parameters
      if (typeof givenQueryObj !== 'object') throw new Error('Query requires a query object')
      if (!('table' in givenQueryObj)) throw new Error('Query queryObj requires a table key')
      
      this.mode = ('mode' in givenQueryObj) ? givenQueryObj.mode : 'http'
      this.serverEndpoint = '/query'
      this.serverMethod = 'POST'
  
      // the default state of the queryObj
      let queryObj = {
        'page': 1,
        'itemsPerPage': 100,
        'columnCompare': 'AND',
        'equalityOperator': '=',
        'prefix': 'server_'
      }
  
      // merge the default queryObj with the given queryObj, possibly
      // overwriting default values
      this.queryObj = Object.assign(queryObj, givenQueryObj)
  
      // build the internal sql string
      this.buildSql()

      // get results for the given page
      await this.execute()

      // count the total number of pages
      await this.calculateTotals()

      // set the top-level page parameter to the given page
      this.page = this.queryObj.page

      // return the instance
      return this
    })()
  }

  /**
   * Constructs the SQL string from the information in this.queryObj.
   * 
   * @ignore
   */
  buildSql() {  
    let sql = ''

    // insert the SELECT clause
    sql += this._buildSelectClause()

    // insert the FROM clause
    sql += this._buildFromClause()

    // insert the JOIN clause (can be omitted)
    sql += this._buildJoinClause()

    // insert the WHERE clause (can be omitted)
    sql += this._buildWhereClause()

    // insert the ORDER BY clause (can be omitted)
    sql += this._buildOrderByClause()

    // add the LIMIT clause (can be omitted)
    sql += this._buildLimitClause()

    // add the OFFSET clause (can be omitted)
    sql += this._buildOffsetClause()

    this.sql = sql
  }

  /**
   * Executes the internal SQL string against the database and updates the internal results array.
   * 
   * @returns {Query} Returns the Query instance.
   * @ignore
   */
  async execute() {
    this.results = await this._send(this.sql)

    this.afterExecute()

    return this
  }

  /**
   * Sends the SQL to the execution destination. For internal use only.
   * 
   * @param {string} sql
   */
  async _send(sql) {
    // http = send to hydra web server
    if (this.mode === 'http') {
      let serverRequest = await Bridge.httpApi(this.serverEndpoint, this.serverMethod, sql)
      return serverRequest.response
    }
    // ipc = send to electron main process
    else if (this.mode === 'ipc') {
      return await Bridge.ipcAsk('sql', sql)
    }
  }

  /**
   * Performs modifications to the results after SQL execution.
   * 
   * @ignore
   */
  afterExecute() {
    // when joining tables that have column name collisions, sqlite will overwrite primary
    // table column value with the joined table column value. In most cases, we
    // actually want primary to overwrite the joined.
    // since all app tables use the same "id" column name for their primary key,
    // this will *always* restore the primary ID when joining. Use the foreign
    // key of the primary row if you need the foreign row primary key.
    if ('join' in this.queryObj && this.results.length) {
      for (let result of this.results) {
        if ('_primaryTableRowId' in result) {
          result.id = result._primaryTableRowId
          delete result._primaryTableRowId
        }
      }
    }
  }

  /**
   * Builds the SELECT clause.
   * 
   * @returns {string}
   * @ignore
   */
  _buildSelectClause() {
    let whenJoining = ''

    // when performing a join, save the primary table ID as a distinct key.
    // it will be used to restore the `id` key after the join.
    if ('join' in this.queryObj) {
      whenJoining = `\n\t${this.queryObj.prefix}${this.queryObj.table}.id AS _primaryTableRowId,`
    }

    return `SELECT${whenJoining}\n\t*`
  }

  /**
   * Builds the FROM clause.
   * 
   * @returns {string}
   * @ignore
   */
  _buildFromClause() {
    return `\nFROM\n\t${this.queryObj.prefix}${this.queryObj.table}`
  }

  /**
   * Builds the INNER JOIN, LEFT JOIN, and CROSS JOIN clauses. Supports any
   * number of JOIN's.
   * 
   * @returns {string}
   * @ignore
   */
  _buildJoinClause() {
    if (!('join' in this.queryObj) || typeof this.queryObj.join !== 'object' || !Object.keys(this.queryObj.join).length) return ''

    let joins
    
    // a singlar join was given, wrap it in an array
    if (!Array.isArray(this.queryObj.join) && typeof this.queryObj.join === 'object' && this.queryObj.join !== null) {
      joins = [this.queryObj.join]
    } else {
      joins = this.queryObj.join
    }

    let sql = ''

    for (let join of joins) {
      // join.table is required
      if (!('table' in join)) throw new Error('JOIN was given without the "table" key')

      // join.columns is required
      if (!('on' in join)) throw new Error('queryObj.join was given without the "on" key')

      // default to LEFT JOIN if no join type is set
      let joinType = ('type' in join) ? join.type : 'LEFT JOIN'

      // default to the `=` operator for ON clauses
      let equalityOperator = ('equalityOperator' in join) ? join.equalityOperator : '='

      // build JOIN line in the clause
      sql += `\n${joinType}\n\t${this.queryObj.prefix}${join.table}`

      // build all ON lines in the clause
      for (let [primaryTableCol, joinedTableCol] of Object.entries(join.on)) {
        // concat the strings to avoid having typed line breaks in the sql
        sql += 
        `\n\tON ${this.queryObj.prefix}${this.queryObj.table}.${primaryTableCol} ` +
        `${equalityOperator} ` +
        `${this.queryObj.prefix}${join.table}.${joinedTableCol}`
      }
    }

    return sql
  }

  /**
   * Builds the WHERE clause.
   * 
   * @returns {string}
   * @ignore
   */
  _buildWhereClause() {
    if (!('columns' in this.queryObj) || typeof this.queryObj.columns !== 'object' || !Object.keys(this.queryObj.columns).length) {
      return ''
    }

    let sql = `\nWHERE\n`

    // columns will be an array that contains objects, each of which can contain
    // any number of column:value pairs.
    let columns = this.queryObj.columns

    // if the columns is an object not an array, wrap it in one
    if (!Array.isArray(columns)) {
      columns = [{...columns}]
    }

    // loop all column objects
    for (let columnsObj of columns) {
      let columnEqualityOperator = this.queryObj.equalityOperator

      // maybe override the equality operator on a per-column-object basis
      if ('equalityOperator' in columnsObj) {
        columnEqualityOperator = columnsObj.equalityOperator
        delete columnsObj.equalityOperator
      }

      for (let [column, value] of Object.entries(columnsObj)) {
        // if the column name contains a period, assume it's the `table.column`
        // format and prefix it
        if (column.includes('.')) {
          column = this.queryObj.prefix + column
        }

        // the given value is a string
        if (typeof value === 'string') {
          sql += `\t${column} ${columnEqualityOperator} '${value}'`
        }
        // the given value is a number
        else if (typeof value === 'number') {
          sql += `\t${column} ${columnEqualityOperator} ${value}`
        }
        // the given value is an array
        else if (Array.isArray(value)) {
          // convert the array to a SQL array which looks like:
          // (1,2,3) or ("item a","item b","item c")
          // using array.join() unfortunately does not produce an array
          // with quotes, so do it manually
          let arrayString = ''

          for (let arrayItem of value) {
            if (typeof arrayItem === 'string') {
              arrayString += `"${arrayItem}",`
            } else if (typeof arrayItem === 'number') {
              arrayString += `${arrayItem},`
            }
          }

          arrayString = arrayString.substr(0, arrayString.length - 1)

          sql += `\t${column} ${columnEqualityOperator} (${arrayString})`
        }

        // add the comparison operator every time
        sql += '\n' + this.queryObj.columnCompare + '\n'
      }
    }

    // trim off the extra comparison operator and the extra new line
    sql = sql.slice(0, sql.length - (this.queryObj.columnCompare.length + 2))

    return sql
  }

  /**
   * Builds the ORDER BY clause. Ordering is always done case insensitive,
   * because otherwise sqlite separates lowercase and uppercase, putting
   * 'blink-182' after 'Z'.
   *
   * @returns {string}
   * @ignore
   */
  _buildOrderByClause() {
    if (!('orderBy' in this.queryObj)) {
      return ''
    }

    // special 'rand' case
    if (this.queryObj.orderBy === 'rand') {
      return `\nORDER BY RANDOM()`
    }

    if (typeof this.queryObj.orderBy !== 'object' || !Object.keys(this.queryObj.orderBy).length) {
      return ''
    }

    let sql = `\nORDER BY`

    for (let [column, order] of Object.entries(this.queryObj.orderBy)) {
      sql += `\n\t${column} COLLATE NOCASE ${order},`
    }

    // trim off the extra comma
    sql = sql.slice(0, sql.length - 1)

    return sql
  }

  /**
   * Builds the LIMIT clause.
   * 
   * @returns {string}
   * @ignore
   */
  _buildLimitClause() {
    // omit the limit clause if showing all results 
    if (this.queryObj.itemsPerPage === -1) {
      return ''
    }

    return `\nLIMIT\n\t${this.queryObj.itemsPerPage}`
  }

  /**
   * Builds the OFFSET clause.
   * 
   * @returns {Number}
   * @ignore
   */
  _buildOffsetClause() {
    // omit the offset clause if showing all results or the first page
    if (this.queryObj.itemsPerPage === -1 || this.queryObj.page === 1) {
      return ''
    }

    return `\nOFFSET\n\t${this._calculateOffset()}`
  }

  /**
   * Calculates the offset number based on the internal queryObj.
   * 
   * @returns {number}
   * @ignore
   */
  _calculateOffset() {
    return (this.queryObj.page * this.queryObj.itemsPerPage) - this.queryObj.itemsPerPage
  }

  /**
   * The preferred/optimized way of working with paginated data once you already
   * have a Query instance.
   *
   * Changes the page internally. This will update the `queryObj` property, the
   * top-level `page` property, the `sql` property, and then it will execute the
   * new SQL string, which updates the internal results array.
   *
   * It does **not** recalculate the total number of pages and results.
   *
   * @param {number} page - The page to go to. If the given page is less than 1,
   * the first page will be selected. If the given page is greater than the
   * total number of pages, the last page will be selected.
   */
  async goToPage(page) {
    // do nothing if we are already on this page
    if (page === this.page) return this

    if (page < 1) page === 1
    if (page > this.pages) page = this.pages

    // update the query object
    this.queryObj.page = page

    // update the top level page item
    this.page = page

    // rebuild the sql string
    this.buildSql()

    // get the new results
    await this.execute()

    return this
  }

  /**
   * Builds and runs a new query on the fly that calculates the total number of
   * pages and total number of items for the given queryObj. This is run on
   * Query init and does not need to be run again, but can be invoked manually.
   */
  async calculateTotals() {
    // there can only be 1 page when showing all items
    if (this.queryObj.itemsPerPage === -1) {
      this.pages = 1
      this.totalResults = this.results.length
      return this
    }

    // copy the existing sql query
    let countSql = this.sql
    
    // replace the "SELECT *" clause with a "SELECT COUNT(*)" clause
    countSql = countSql.replace(/[^*]*/, '') // erase everything up to the first asterisk
    countSql = countSql.replace('*', 'SELECT COUNT(*) AS numItems')
    
    // remove the OFFSET clause (if there is one)
    countSql = countSql.replace(`OFFSET\n\t${this._calculateOffset()}`, '')
    
    // execute the sql in the main process
    let countResults = await this._send(countSql)
    
    this.totalResults = countResults[0].numItems
    this.pages = Math.ceil(Number(countResults[0].numItems) / Number(this.queryObj.itemsPerPage))

    return this
  }
}