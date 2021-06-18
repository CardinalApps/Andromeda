<a name="module_Query"></a>

## Query

* [Query](#module_Query)
    * [module.exports](#exp_module_Query--module.exports) ⏏
        * [new module.exports()](#new_module_Query--module.exports_new)
        * [._send(sql)](#module_Query--module.exports+_send)
        * [.goToPage(page)](#module_Query--module.exports+goToPage)
        * [.calculateTotals()](#module_Query--module.exports+calculateTotals)

<a name="exp_module_Query--module.exports"></a>

### module.exports ⏏
**Kind**: Exported class  
<a name="new_module_Query--module.exports_new"></a>

#### new module.exports()
Constructor.


| Param | Type | Description |
| --- | --- | --- |
| givenQueryObj.table | <code>string</code> | The table name, without the prefix. |
| [givenQueryObj.prefix] | <code>string</code> | If the database uses a table name prefix, it can be set here. All table names in all parts of the query do not require the prefix if it's set here. Defaults to `server_` for [Cardinal](https://cardinalapps.xyz) purposes |
| [givenQueryObj.itemsPerPage] | <code>string</code> | Defaults to 100. Set to -1 for no limit per page, which puts all results on page 1. |
| [givenQueryObj.columns] | <code>string</code> | An object of `column: value` pairs that must exactly match the  database contents. Values can be a string, number, or array. Or, an array of such objects. When performing a join, you can set the table name in the column name like `artists.id` to handle column name collisions. You may provide an "equalityOperator" key on a per-column-object basis so that queries of multiple compares can be combined (ie. get all artists except *these*).. |
| [givenQueryObj.columnCompare] | <code>string</code> | Operator used when querying for multiple columns. Either `AND` or `OR`. Defaults to `AND`. |
| [givenQueryObj.equalityOperator] | <code>string</code> | Operator used when checking the value of the column. Can be `=`, `LIKE`, `IN`, or `NOT IN`. Defaults to `=`. When using `LIKE`, you must put `%` signs around your string. |
| [givenQueryObj.orderBy] | <code>string</code> | Optionally order the results. Use an array of single entry objects of `column: order` key-value pairs. Orders are `ASC` and `DESC`. When omitted, the results are returned in the order that they exist in the database. This can also be set to the `rand` for random order. |
| [givenQueryObj.page] | <code>string</code> | Initial page to load. Defaults to page 1. Use `goToPage()` to switch pages afterwards. |
| [givenQueryObj.join] | <code>string</code> | An object that performs a table join, or an array of such objects. |
| givenQueryObj.join.table | <code>string</code> | Required. The table name to join, without prefix. |
| givenQueryObj.join.on | <code>string</code> | An object of `PrimaryTableColumn:ForeignTableColumn` keys and values that produce the ON statement. |
| [givenQueryObj.join.equalityOperator] | <code>string</code> | Equality operator when comparing primary to foreign values. |
| [givenQueryObj.join.type] | <code>string</code> | Either `LEFT JOIN`, `INNER JOIN`, or `CROSS JOIN`. Defaults to `LEFT JOIN`. |
| [givenQueryObj.mode] | <code>string</code> | For [Cardinal](https://cardinalapps.xyz) purposes. Either `http` or `ipc`. Defaults to `http`. See [README.me#Setting the Endpoint](#setting-the-endpoint). |

<a name="module_Query--module.exports+_send"></a>

#### module.exports.\_send(sql)
Sends the SQL to the execution destination. For internal use only.

**Kind**: instance method of [<code>module.exports</code>](#exp_module_Query--module.exports)  

| Param | Type |
| --- | --- |
| sql | <code>string</code> | 

<a name="module_Query--module.exports+goToPage"></a>

#### module.exports.goToPage(page)
The preferred/optimized way of working with paginated data once you already
have a Query instance.

Changes the page internally. This will update the `queryObj` property, the
top-level `page` property, the `sql` property, and then it will execute the
new SQL string, which updates the internal results array.

It does **not** recalculate the total number of pages and results.

**Kind**: instance method of [<code>module.exports</code>](#exp_module_Query--module.exports)  

| Param | Type | Description |
| --- | --- | --- |
| page | <code>number</code> | The page to go to. If the given page is less than 1, the first page will be selected. If the given page is greater than the total number of pages, the last page will be selected. |

<a name="module_Query--module.exports+calculateTotals"></a>

#### module.exports.calculateTotals()
Builds and runs a new query on the fly that calculates the total number of
pages and total number of items for the given queryObj. This is run on
Query init and does not need to be run again, but can be invoked manually.

**Kind**: instance method of [<code>module.exports</code>](#exp_module_Query--module.exports)  
