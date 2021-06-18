<a name="module_double-u"></a>

## double-u

* [double-u](#module_double-u)
    * [.__Object](#module_double-u.__Object)
        * [new exports.__Object(selector)](#new_module_double-u.__Object_new)
        * [.each(callback)](#module_double-u.__Object+each)
        * [.el()](#module_double-u.__Object+el) ⇒ <code>Element</code>
        * [.on(eventType, [forceDelegation], cb)](#module_double-u.__Object+on)
        * [.off(eventType, cb)](#module_double-u.__Object+off)
        * [.addClass(...className)](#module_double-u.__Object+addClass)
        * [.removeClass(...className)](#module_double-u.__Object+removeClass)
        * [.toggleClass(...className)](#module_double-u.__Object+toggleClass)
        * [.hasClass(className)](#module_double-u.__Object+hasClass) ⇒ <code>boolean</code>
        * [.attr(name, [value])](#module_double-u.__Object+attr) ⇒ <code>mixed</code>
        * [.hasAttr(attribute)](#module_double-u.__Object+hasAttr)
        * [.removeAttr(name)](#module_double-u.__Object+removeAttr)
        * [.watchAttrs(attrs, cb)](#module_double-u.__Object+watchAttrs)
        * [.value([value])](#module_double-u.__Object+value) ⇒ <code>\*</code> \| <code>array</code> \| <code>\_\_Object</code>
        * [.css(css)](#module_double-u.__Object+css) ⇒ <code>mixed</code>
        * [.find(selector)](#module_double-u.__Object+find) ⇒ <code>\_\_Object</code>
        * [.firstChild()](#module_double-u.__Object+firstChild) ⇒ <code>\_\_Object</code>
        * [.lastChild()](#module_double-u.__Object+lastChild) ⇒ <code>\_\_Object</code>
        * [.parents(selector)](#module_double-u.__Object+parents)
        * [.hasParent(givenParent)](#module_double-u.__Object+hasParent) ⇒ <code>boolean</code>
        * [.closest(selector)](#module_double-u.__Object+closest) ⇒ <code>\_\_Object</code>
        * [.siblings([direction], [selectorFilter])](#module_double-u.__Object+siblings) ⇒ <code>\_\_Object</code>
        * [.remove()](#module_double-u.__Object+remove)
        * [.removeChildren()](#module_double-u.__Object+removeChildren) ⇒ <code>\_\_Object</code>
        * [.html()](#module_double-u.__Object+html)
        * [.text()](#module_double-u.__Object+text)
        * [.prependHtml()](#module_double-u.__Object+prependHtml) ⇒ <code>\_\_Object</code>
        * [.appendHtml()](#module_double-u.__Object+appendHtml) ⇒ <code>\_\_Object</code>
        * [.before([markup])](#module_double-u.__Object+before) ⇒ <code>\_\_Object</code>
        * [.after(markup)](#module_double-u.__Object+after) ⇒ <code>\_\_Object</code>
        * [.moveTo(destinationEl, position)](#module_double-u.__Object+moveTo) ⇒ <code>\_\_Object</code>
        * [.wrapInto(into)](#module_double-u.__Object+wrapInto) ⇒ <code>\_\_Object</code>
        * [.unwrap()](#module_double-u.__Object+unwrap)
        * [.randomStr(length, pool)](#module_double-u.__Object+randomStr)
        * [.randomNumberBetween(min, max)](#module_double-u.__Object+randomNumberBetween)
        * [.randomFromArray(array)](#module_double-u.__Object+randomFromArray) ⇒ <code>\*</code>
        * [.odds(oddsObj, returnPool)](#module_double-u.__Object+odds)
        * [.shuffle(arrayToShuffle)](#module_double-u.__Object+shuffle) ⇒ <code>array</code>
        * [.getHtmlFromFile(path, [replacement], [bypassCache])](#module_double-u.__Object+getHtmlFromFile)
        * [.getJSONFromFile(path, [asString], [flattened])](#module_double-u.__Object+getJSONFromFile)
        * [.getFileContents(path, bypassCache)](#module_double-u.__Object+getFileContents) ⇒ <code>string</code>
        * [.getTemplate([selector&#x3D;])](#module_double-u.__Object+getTemplate)
        * [.width()](#module_double-u.__Object+width) ⇒ <code>Number</code>
        * [.height()](#module_double-u.__Object+height) ⇒ <code>Number</code>
        * [.position()](#module_double-u.__Object+position) ⇒ <code>array</code> \| <code>object</code>
        * [.animate(animation, [speed], [delay])](#module_double-u.__Object+animate) ⇒ <code>Promise</code>
        * [.show(display)](#module_double-u.__Object+show) ⇒ <code>\_\_Object</code>
        * [.hide()](#module_double-u.__Object+hide) ⇒ <code>\_\_Object</code>
        * [.enforceSingleton(elName, el)](#module_double-u.__Object+enforceSingleton) ⇒ <code>boolean</code>
        * [.trigger(eventType)](#module_double-u.__Object+trigger)
        * [.__doubleSlashesOnWindowsOnly()](#module_double-u.__Object+__doubleSlashesOnWindowsOnly)
        * [.convertSecondsToHHMMSS(seconds, trimHours, trimMinutes)](#module_double-u.__Object+convertSecondsToHHMMSS)
        * [.getArrayIntersection(a, b)](#module_double-u.__Object+getArrayIntersection) ⇒ <code>array</code>
        * [.infiniteScroll(cb, scrollParent)](#module_double-u.__Object+infiniteScroll) ⇒ <code>function</code>
        * [.itemsPerRow(selector)](#module_double-u.__Object+itemsPerRow) ⇒ <code>array</code>
        * [.getShortest()](#module_double-u.__Object+getShortest) ⇒ <code>\_\_Object</code>
        * [.keepFocusWithin(containerSelector)](#module_double-u.__Object+keepFocusWithin)
        * [.releaseFocus()](#module_double-u.__Object+releaseFocus)
        * [.debouncer()](#module_double-u.__Object+debouncer)
        * [.throttler()](#module_double-u.__Object+throttler)
        * [.numberIsBetween(numberToCheck, min, max, [inclusive])](#module_double-u.__Object+numberIsBetween)
        * [.chunk(chunkLength)](#module_double-u.__Object+chunk)

<a name="module_double-u.__Object"></a>

### __.\_\_Object
Returns a new __Object for chaining.

**Kind**: static class of [<code>double-u</code>](#module_double-u)  

* [.__Object](#module_double-u.__Object)
    * [new exports.__Object(selector)](#new_module_double-u.__Object_new)
    * [.each(callback)](#module_double-u.__Object+each)
    * [.el()](#module_double-u.__Object+el) ⇒ <code>Element</code>
    * [.on(eventType, [forceDelegation], cb)](#module_double-u.__Object+on)
    * [.off(eventType, cb)](#module_double-u.__Object+off)
    * [.addClass(...className)](#module_double-u.__Object+addClass)
    * [.removeClass(...className)](#module_double-u.__Object+removeClass)
    * [.toggleClass(...className)](#module_double-u.__Object+toggleClass)
    * [.hasClass(className)](#module_double-u.__Object+hasClass) ⇒ <code>boolean</code>
    * [.attr(name, [value])](#module_double-u.__Object+attr) ⇒ <code>mixed</code>
    * [.hasAttr(attribute)](#module_double-u.__Object+hasAttr)
    * [.removeAttr(name)](#module_double-u.__Object+removeAttr)
    * [.watchAttrs(attrs, cb)](#module_double-u.__Object+watchAttrs)
    * [.value([value])](#module_double-u.__Object+value) ⇒ <code>\*</code> \| <code>array</code> \| <code>\_\_Object</code>
    * [.css(css)](#module_double-u.__Object+css) ⇒ <code>mixed</code>
    * [.find(selector)](#module_double-u.__Object+find) ⇒ <code>\_\_Object</code>
    * [.firstChild()](#module_double-u.__Object+firstChild) ⇒ <code>\_\_Object</code>
    * [.lastChild()](#module_double-u.__Object+lastChild) ⇒ <code>\_\_Object</code>
    * [.parents(selector)](#module_double-u.__Object+parents)
    * [.hasParent(givenParent)](#module_double-u.__Object+hasParent) ⇒ <code>boolean</code>
    * [.closest(selector)](#module_double-u.__Object+closest) ⇒ <code>\_\_Object</code>
    * [.siblings([direction], [selectorFilter])](#module_double-u.__Object+siblings) ⇒ <code>\_\_Object</code>
    * [.remove()](#module_double-u.__Object+remove)
    * [.removeChildren()](#module_double-u.__Object+removeChildren) ⇒ <code>\_\_Object</code>
    * [.html()](#module_double-u.__Object+html)
    * [.text()](#module_double-u.__Object+text)
    * [.prependHtml()](#module_double-u.__Object+prependHtml) ⇒ <code>\_\_Object</code>
    * [.appendHtml()](#module_double-u.__Object+appendHtml) ⇒ <code>\_\_Object</code>
    * [.before([markup])](#module_double-u.__Object+before) ⇒ <code>\_\_Object</code>
    * [.after(markup)](#module_double-u.__Object+after) ⇒ <code>\_\_Object</code>
    * [.moveTo(destinationEl, position)](#module_double-u.__Object+moveTo) ⇒ <code>\_\_Object</code>
    * [.wrapInto(into)](#module_double-u.__Object+wrapInto) ⇒ <code>\_\_Object</code>
    * [.unwrap()](#module_double-u.__Object+unwrap)
    * [.randomStr(length, pool)](#module_double-u.__Object+randomStr)
    * [.randomNumberBetween(min, max)](#module_double-u.__Object+randomNumberBetween)
    * [.randomFromArray(array)](#module_double-u.__Object+randomFromArray) ⇒ <code>\*</code>
    * [.odds(oddsObj, returnPool)](#module_double-u.__Object+odds)
    * [.shuffle(arrayToShuffle)](#module_double-u.__Object+shuffle) ⇒ <code>array</code>
    * [.getHtmlFromFile(path, [replacement], [bypassCache])](#module_double-u.__Object+getHtmlFromFile)
    * [.getJSONFromFile(path, [asString], [flattened])](#module_double-u.__Object+getJSONFromFile)
    * [.getFileContents(path, bypassCache)](#module_double-u.__Object+getFileContents) ⇒ <code>string</code>
    * [.getTemplate([selector&#x3D;])](#module_double-u.__Object+getTemplate)
    * [.width()](#module_double-u.__Object+width) ⇒ <code>Number</code>
    * [.height()](#module_double-u.__Object+height) ⇒ <code>Number</code>
    * [.position()](#module_double-u.__Object+position) ⇒ <code>array</code> \| <code>object</code>
    * [.animate(animation, [speed], [delay])](#module_double-u.__Object+animate) ⇒ <code>Promise</code>
    * [.show(display)](#module_double-u.__Object+show) ⇒ <code>\_\_Object</code>
    * [.hide()](#module_double-u.__Object+hide) ⇒ <code>\_\_Object</code>
    * [.enforceSingleton(elName, el)](#module_double-u.__Object+enforceSingleton) ⇒ <code>boolean</code>
    * [.trigger(eventType)](#module_double-u.__Object+trigger)
    * [.__doubleSlashesOnWindowsOnly()](#module_double-u.__Object+__doubleSlashesOnWindowsOnly)
    * [.convertSecondsToHHMMSS(seconds, trimHours, trimMinutes)](#module_double-u.__Object+convertSecondsToHHMMSS)
    * [.getArrayIntersection(a, b)](#module_double-u.__Object+getArrayIntersection) ⇒ <code>array</code>
    * [.infiniteScroll(cb, scrollParent)](#module_double-u.__Object+infiniteScroll) ⇒ <code>function</code>
    * [.itemsPerRow(selector)](#module_double-u.__Object+itemsPerRow) ⇒ <code>array</code>
    * [.getShortest()](#module_double-u.__Object+getShortest) ⇒ <code>\_\_Object</code>
    * [.keepFocusWithin(containerSelector)](#module_double-u.__Object+keepFocusWithin)
    * [.releaseFocus()](#module_double-u.__Object+releaseFocus)
    * [.debouncer()](#module_double-u.__Object+debouncer)
    * [.throttler()](#module_double-u.__Object+throttler)
    * [.numberIsBetween(numberToCheck, min, max, [inclusive])](#module_double-u.__Object+numberIsBetween)
    * [.chunk(chunkLength)](#module_double-u.__Object+chunk)

<a name="new_module_double-u.__Object_new"></a>

#### new exports.\_\_Object(selector)
Constructor.


| Param | Type |
| --- | --- |
| selector | <code>\*</code> | 

<a name="module_double-u.__Object+each"></a>

#### __Object.each(callback)
Run a callback on each element in the __Object. Does not forbid looping an
empty set of elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The callback function to run. |

<a name="module_double-u.__Object+el"></a>

#### __Object.el() ⇒ <code>Element</code>
Returns the first element from the `__Object.els` array. Useful for when
the Element itself is needed for invoking class (custom element) methods.
Since the typical use case for this is something like
`__('custom-element').el().classMethod()`, this will warn you if the
`__Object.els` array contains more than a single item, or if that item is
not an Element.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>Element</code> - The first item in the __Object  
<a name="module_double-u.__Object+on"></a>

#### __Object.on(eventType, [forceDelegation], cb)
Registers event handlers for a given selector. If the selector matches any
DOM nodes, the event handler will be attached directly to those nodes. This
means that something like __('a.link').on('click') will only work for the
`a.link`'s that exist in the DOM at the time `.on()` was run. 

To alleviate this and have the event hander work for all current and future
DOM nodes, set `forceDelegation` to true. This will instead defer the event
handler to the `document`.

If the given CSS selector does not match any DOM nodes, the event hander
will automatically be delegated.

Within the callback function, `this` is equal to the target Element.

**Notice**: Delegated events do not support `mouseenter`, use `mouseover`
instead. This is a caveat of delegating to document instead of defining a
parent element each time. Full explanation in source code.

**Notice**: There is a maximum of 1 delegated callback function per
selector. That means that if this method is used like
`__('a.link').on('click', true, cb1)`, and then later on again as
`__('a.link').on('click', true, cb2)`, only the callback function given in
the first usage will fire (`cb1`). This behavior is by design, and keeps
the door closed to blindly delegating all events to the document and
bloating each event with unnecessary checks. The goal is to attach events
to their proper Element instance when possible.

All callbacks are stored in `window.__delegations`.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| eventType | <code>string</code> | The type of event to listen for, ie. "click", "submit", "keydown" etc. |
| [forceDelegation] | <code>boolean</code> \| <code>function</code> \| <code>Element</code> | If `true`, this automatically defers to the `document`. If an Element, the event will be attached to that Element. Or the callback function. |
| cb | <code>function</code> | The callback function when forcing delegation. TODO this needs to be refactored, it's now convoluted after dozens of small edits |

<a name="module_double-u.__Object+off"></a>

#### __Object.off(eventType, cb)
Removes an event handler that was delegated to the document by `on()`.
Note: the CSS selector must match exaclty when using `on()` and `off()`.
For example:

    __('table tbody tr').on('click', true, cb)
    __('table tbody tr').off('click', cb) // works

    __('table tbody tr').on('click', true, cb)
    __('table tr').off('click', cb) // doesn't work, even though the selector technically matches (some of) the same elements

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| eventType | <code>string</code> | The type of event to listen for, ie. "click", "submit", "keydown" etc. |
| cb | <code>function</code> | The callback function that was delegated with `on()`. |

<a name="module_double-u.__Object+addClass"></a>

#### __Object.addClass(...className)
Add a class to the elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| ...className | <code>String</code> | Any number of class names to add. |

<a name="module_double-u.__Object+removeClass"></a>

#### __Object.removeClass(...className)
Remove a class from the elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| ...className | <code>String</code> | Any number of class names to remove. |

<a name="module_double-u.__Object+toggleClass"></a>

#### __Object.toggleClass(...className)
Toggles a class on all of the elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| ...className | <code>String</code> | Any number of class names to toggle. |

<a name="module_double-u.__Object+hasClass"></a>

#### __Object.hasClass(className) ⇒ <code>boolean</code>
Checks if **any** of the elements in the set of elements has the given class.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| className | <code>string</code> | The class name to check for. |

<a name="module_double-u.__Object+attr"></a>

#### __Object.attr(name, [value]) ⇒ <code>mixed</code>
Gets, creates, or edits an attribute on one or more elements.

If no value is given, and the set only contains one element, the element's
attribute's value will be returned. If the attribute does not exist,
`undefined` will be returned. If if exists but is empty, then `null` will
be returned.

If the set of elements contains multiple elements, an array of non-empty
attribute values will be returned.

If a value is given, then the attribute is updated for each element in the
set.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>mixed</code> - The attribute value, undefined if the attribute didn't
exist, and null if exists but is empty.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The attribute name to get, create, or edit. |
| [value] | <code>Number</code> | The value to set the attribute to. Chainable when a value is given. |

<a name="module_double-u.__Object+hasAttr"></a>

#### __Object.hasAttr(attribute)
Returns true if all Elements in the set of matched Elements has the given attribute, otherwise returns false.
**Not chainable.**

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| attribute | <code>string</code> | The attribute name to check for. |

<a name="module_double-u.__Object+removeAttr"></a>

#### __Object.removeAttr(name)
Removes an attribute from the set of elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The attribute name to remove. |

<a name="module_double-u.__Object+watchAttrs"></a>

#### __Object.watchAttrs(attrs, cb)
This method will create MutationObserves that will watch for attribute
changes on each of the elements in the set of matched elements. **Not
chainable**. This was created in order to avoid rapidfire callback issues
when init-ing a custom element with static attributes.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| attrs | <code>array</code> | An array of sttributes to watch. |
| cb | <code>function</code> | Callback on attribute change. The callback first param is the array of mutations, and the second param is the Element who's attributes were changed. |

<a name="module_double-u.__Object+value"></a>

#### __Object.value([value]) ⇒ <code>\*</code> \| <code>array</code> \| <code>\_\_Object</code>
Same as attr but for values on form fields.

When used on an input[type="file"], it will look in where Electron saves
selected filepaths.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\*</code> \| <code>array</code> \| <code>\_\_Object</code> - If performing a lookup, this returns the
Element value, or an array of Element values. If setting the value, this
returns the __Object for chaining.

TODO add radios  

| Param | Type | Description |
| --- | --- | --- |
| [value] | <code>string</code> | If present, this will update the value of all Elements in the set of matches Elements. |

<a name="module_double-u.__Object+css"></a>

#### __Object.css(css) ⇒ <code>mixed</code>
If a string is given, then that CSS property will be returned.

If an object is given, key:value will be mapped to CSS property:value.
Converts CSS values that are numbers to a string ending in "px".

**Overwrites the style attribute on every use.**

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>mixed</code> - An array or a string when doing a lookup, or an __Object
when setting.  

| Param | Type |
| --- | --- |
| css | <code>object</code> \| <code>string</code> | 

<a name="module_double-u.__Object+find"></a>

#### __Object.find(selector) ⇒ <code>\_\_Object</code>
Returns a new __Object of matching element children.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\_\_Object</code> - __Object instance  

| Param | Type |
| --- | --- |
| selector | <code>string</code> | 

<a name="module_double-u.__Object+firstChild"></a>

#### __Object.firstChild() ⇒ <code>\_\_Object</code>
Gets the first child of every element in the given set of elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\_\_Object</code> - A new __Object instantiated with the found first
childen, or null.  
<a name="module_double-u.__Object+lastChild"></a>

#### __Object.lastChild() ⇒ <code>\_\_Object</code>
Gets the first child of every element in the given set of elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\_\_Object</code> - A new __Object instantiated with the found first
childen, or null.  
<a name="module_double-u.__Object+parents"></a>

#### __Object.parents(selector)
Returns all parent nodes matching a selector

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| selector | <code>string</code> | Optional CSS3 selector to filter by |

<a name="module_double-u.__Object+hasParent"></a>

#### __Object.hasParent(givenParent) ⇒ <code>boolean</code>
Checks if any of the Elements in the matched set of Elements has the given
parent. **Not chainable.**

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| givenParent | <code>Element</code> \| <code>string</code> | An Element, or a CSS string to match against. |

<a name="module_double-u.__Object+closest"></a>

#### __Object.closest(selector) ⇒ <code>\_\_Object</code>
Mimics the native Element.closest() method. If the set of Elements contains
more than one Element, each of their closest parent will be included in the
returned __Object.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\_\_Object</code> - A new __Object with the parental matches.  

| Param | Type | Description |
| --- | --- | --- |
| selector | <code>string</code> | CSS selector for finding the closest parent. |

<a name="module_double-u.__Object+siblings"></a>

#### __Object.siblings([direction], [selectorFilter]) ⇒ <code>\_\_Object</code>
Get the previous, next, or all siblings relative to a DOM element.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\_\_Object</code> - An __Object for chaining.  

| Param | Type | Description |
| --- | --- | --- |
| [direction] | <code>string</code> | `prev`, `next`, or `all`. Defaults to 'all'. When `next` or `prev` are used, the given element will not be included in the results (because you are not your own sibling). When 'all' is used (or this param is omitted), the given selector will be included (because you are a sibling among others). |
| [selectorFilter] | <code>string</code> | Optionally filter the siblings with a CSS3 filter. |

<a name="module_double-u.__Object+remove"></a>

#### __Object.remove()
Removes all elements in the set from the DOM. Not chainable.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
<a name="module_double-u.__Object+removeChildren"></a>

#### __Object.removeChildren() ⇒ <code>\_\_Object</code>
Delete all the child nodes of each element in the set.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\_\_Object</code> - Returns the same __Object instance.  
<a name="module_double-u.__Object+html"></a>

#### __Object.html()
Replaces the .innerHTML of each element in the set of elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Content**: <code>string</code> content - HTML string.  
<a name="module_double-u.__Object+text"></a>

#### __Object.text()
Replaces the .innerText of each element in the set of elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Content**: <code>string</code> content - String.  
<a name="module_double-u.__Object+prependHtml"></a>

#### __Object.prependHtml() ⇒ <code>\_\_Object</code>
Alias for _insertHtml().

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Since**: 0.0.1  
<a name="module_double-u.__Object+appendHtml"></a>

#### __Object.appendHtml() ⇒ <code>\_\_Object</code>
Alias for _insertHtml().

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Since**: 0.0.1  
<a name="module_double-u.__Object+before"></a>

#### __Object.before([markup]) ⇒ <code>\_\_Object</code>
Inserts HTML markup before each element in the matched set of elements, or
returns all of the directly preceeding elements of all the elements in the
set of matched elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type |
| --- | --- |
| [markup] | <code>string</code> | 

<a name="module_double-u.__Object+after"></a>

#### __Object.after(markup) ⇒ <code>\_\_Object</code>
Inserts HTML markup after each element in the matched set of elements, or
returns all of the directly next elements of all the elements in the set of
matched elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type |
| --- | --- |
| markup | <code>string</code> | 

<a name="module_double-u.__Object+moveTo"></a>

#### __Object.moveTo(destinationEl, position) ⇒ <code>\_\_Object</code>
Moves all of the Elements in the set of matched Elements to the reference
node given as the first parameter.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\_\_Object</code> - Returns the original `__Object` that contains the
elements that were moved.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| destinationEl | <code>Element</code> |  | Reference to the destination Element. |
| position | <code>string</code> | <code>&quot;afterbegin&quot;</code> | `beforebegin`, `afterbegin`, `beforeend`, `afterend` |

<a name="module_double-u.__Object+wrapInto"></a>

#### __Object.wrapInto(into) ⇒ <code>\_\_Object</code>
Wraps all elements in the set of elements with given text markup. Event
handers are preserved.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| into | <code>string</code> | Text HTML, single dimensional. |

<a name="module_double-u.__Object+unwrap"></a>

#### __Object.unwrap()
Removes an element from the DOM but keeps its children. Event handlers on the children are preserved.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
<a name="module_double-u.__Object+randomStr"></a>

#### __Object.randomStr(length, pool)
Standard library function that returns a random string from a pool of
characters. Can't be chained, and doesn't require any elements in `.els`.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| length | <code>Integer</code> | <code>5</code> | Number of characters to return. |
| pool | <code>string</code> | <code>&quot;abcdefghijklmnopqrstuvwxyz1234567890&quot;</code> | Valid characters for the string. |

<a name="module_double-u.__Object+randomNumberBetween"></a>

#### __Object.randomNumberBetween(min, max)
Standard library function that returns a random number between two numbers.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| min | <code>number</code> | The lower boundary. |
| max | <code>number</code> | The ligher boundary. |

<a name="module_double-u.__Object+randomFromArray"></a>

#### __Object.randomFromArray(array) ⇒ <code>\*</code>
Returns a random item from an array.

If the randomly selected item in the array is an `object` (and not null),
or an array, then a new clone of that object will be returned to avoid
having a reference to the pool object.

All other data types are returned untouched.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\*</code> - Returns a random item from the array.  

| Param | Type | Description |
| --- | --- | --- |
| array | <code>array</code> | An array with >=1 items. |

<a name="module_double-u.__Object+odds"></a>

#### __Object.odds(oddsObj, returnPool)
Returns a single random item from a given object of odds.

Example:
```
// 2/20 chance of returing "rare", 18/20 chance of "common"
{
  'rare': '2/20',
  'common': '18/20'
}
```

Note: the fractions must add up to 1/1 and must all have the same
denominator. If not, the results will be unpredictable. If the string
"__UNFILLED__" is in the pool, your fractions don't add up to 1/1. You can
use the `returnPool` argument to examine the pool.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| oddsObj | <code>object</code> |  | An object of items and their odds. Items must be strings or numbers. |
| returnPool | <code>boolean</code> | <code>false</code> | Whether to return the pool of items instead of the results. Useful to test if the fractions are working properly. |

<a name="module_double-u.__Object+shuffle"></a>

#### __Object.shuffle(arrayToShuffle) ⇒ <code>array</code>
Shuffles an array. The returned array is not guarenteed to be in a
different order than the given array. No element selector is required.

https://stackoverflow.com/a/6274398/1595848

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| arrayToShuffle | <code>array</code> | The array to be shuffled. |

<a name="module_double-u.__Object+getHtmlFromFile"></a>

#### __Object.getHtmlFromFile(path, [replacement], [bypassCache])
Returns the contents of a HTML file. Only works in Electron.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path to the template from the theme root. |
| [replacement] | <code>object</code> | Additional merge tags for the HTML template. |
| [bypassCache] | <code>boolean</code> | Set to true to skip the cache and perform the file lookup. Defaults to false. TODO remove |

<a name="module_double-u.__Object+getJSONFromFile"></a>

#### __Object.getJSONFromFile(path, [asString], [flattened])
Returns the contents of a .json file. Only works in Electron. This function
will **not** parse `{{}}` merge tags like `getHtmlFromFile()` does.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | The path to the template from the theme root. |
| [asString] | <code>boolean</code> | <code>false</code> | Return the string contents of the file rather than parsing it. |
| [flattened] | <code>boolean</code> | <code>false</code> | If asString is true, this can be used to trim whitespace from the JSON string. TODO remove |

<a name="module_double-u.__Object+getFileContents"></a>

#### __Object.getFileContents(path, bypassCache) ⇒ <code>string</code>
Returns the raw contents of a file. Will cache file contents after first
lookup in `window.__fileCache`.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | File path from the theme root. |
| bypassCache | <code>boolean</code> | <code>false</code> | Set to true to skip the cache and perform the file lookup. |

<a name="module_double-u.__Object+getTemplate"></a>

#### __Object.getTemplate([selector&#x3D;])
Returns the first `<template>` that matches the selector it finds in any of
the elments in the set. This is by design - this function only gets the
contents of a single <template> element.

This function does not technically return the exact DocumentFragment from
the <template> element. Instead, it copies the <template>.innerHTML as a
string, and injects it into a new DocumentFragment. Otherwise, the
<template> would only have one use, because DocumentFragment nodes are
live.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| [selector=] | <code>string</code> | Optional CSS3 selector for the template. Usage with the selector looks like '__('body').getTemplate('#some-template')'. Usage without the selector looks like `__('#some-template').getTemplate()` |

<a name="module_double-u.__Object+width"></a>

#### __Object.width() ⇒ <code>Number</code>
Expects a single Element in the set of matches elements. Returns its width.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
<a name="module_double-u.__Object+height"></a>

#### __Object.height() ⇒ <code>Number</code>
Expects a single Element in the set of matches elements. Returns its
height.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
<a name="module_double-u.__Object+position"></a>

#### __Object.position() ⇒ <code>array</code> \| <code>object</code>
Returns the x,y coordinates for an element on the page relative to the
window. Not chainable.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>array</code> \| <code>object</code> - - Either a pair of coordinates, or an array of
pairs, depending if multiple elements were given.  
<a name="module_double-u.__Object+animate"></a>

#### __Object.animate(animation, [speed], [delay]) ⇒ <code>Promise</code>
Animates an element using CSS classes, and invokes the callback function
after. Can be chained, and the chain will be delayed while waiting for
animations to complete.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>Promise</code> - A promise that resolves into an __Object  

| Param | Type | Description |
| --- | --- | --- |
| animation | <code>string</code> | Animate.css class name |
| [speed] | <code>Number</code> \| <code>function</code> | "slow", "slower", "fast", "faster", or "speed-1s" (1s through 5s) |
| [delay] | <code>Number</code> \| <code>function</code> | "delay-1s", "delay-2s", "delay-3s", "delay-4s", "delay-5s" |

<a name="module_double-u.__Object+show"></a>

#### __Object.show(display) ⇒ <code>\_\_Object</code>
Shows all elements that match the given selector.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| display | <code>string</code> | <code>&quot;block&quot;</code> | The CSS 'display' attribute value. |

<a name="module_double-u.__Object+hide"></a>

#### __Object.hide() ⇒ <code>\_\_Object</code>
Hides all elements that match the given selector.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
<a name="module_double-u.__Object+enforceSingleton"></a>

#### __Object.enforceSingleton(elName, el) ⇒ <code>boolean</code>
This helper is designed to be the first thing invoked when singleton custom
elements are created in the DOM, and it will instantly remove the extra
copy of the element and show an error in the console so that the offending
code can be fixed.

Make sure this is the first code called in the element init.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>boolean</code> - True if the element had to be deleted, false if nothing
had to be enforced.  

| Param | Type | Description |
| --- | --- | --- |
| elName | <code>string</code> | Element name as a string, not an actual Element. |
| el | <code>Element</code> | Reference to the custom element being created. |

<a name="module_double-u.__Object+trigger"></a>

#### __Object.trigger(eventType)
Triggers a basic event for the given eventType.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| eventType | <code>string</code> | Click, keydown, etc. TODO support keyboard events |

<a name="module_double-u.__Object+__doubleSlashesOnWindowsOnly"></a>

#### __Object.\_\_doubleSlashesOnWindowsOnly()
Implements the workaround for the Electron Issue raised here:
https://github.com/electron/electron/issues/23435

All file paths that go to the appdata folder to retreive an image that is
to be used in a CSS background-image must use this workaround in order to
load on Windows.

TODO remove this when Electron is fixed.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
<a name="module_double-u.__Object+convertSecondsToHHMMSS"></a>

#### __Object.convertSecondsToHHMMSS(seconds, trimHours, trimMinutes)
Converts a number of a seconds to hh:mm:ss.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| seconds | <code>number</code> |  |  |
| trimHours | <code>boolean</code> | <code>true</code> | Whether to trim the hours if they are 00. |
| trimMinutes | <code>boolean</code> |  | Whether to trim the leading zero from whatever time is returned. |

<a name="module_double-u.__Object+getArrayIntersection"></a>

#### __Object.getArrayIntersection(a, b) ⇒ <code>array</code>
Returns the values that intersect between two arrays.

Example: [1,5,8,17] and [3,5,8,14] returns [5,8]

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| a | <code>array</code> | First array. |
| b | <code>array</code> | Second array. |

<a name="module_double-u.__Object+infiniteScroll"></a>

#### __Object.infiniteScroll(cb, scrollParent) ⇒ <code>function</code>
This function expects only a single Element in the set of matched Elements,
and it will add a scroll listener on `.view-content` that triggers the
given callback when it's time to load more content in the given Element.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>function</code> - Returns the scroll listener function, so that it can be
unregistered later.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cb | <code>function</code> |  | Callback function. |
| scrollParent | <code>string</code> | <code>&quot;.view-content&quot;</code> | CSS selector for the element on which to attach the scroll listener. Defaults to `.view-content`. |

<a name="module_double-u.__Object+itemsPerRow"></a>

#### __Object.itemsPerRow(selector) ⇒ <code>array</code>
Calculates how many items there are per row in a rendered Element. This
function expects exactly 1 Element in the set of given Elements.

Note that if your rows children are not equal heights, the results of this
will be unreliable.

Example: let itemsPerRow = __('#parent').itemsPerRow('.childrenToCount')

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>array</code> - Returns an array with the number of children per row.
Index 0 is the number of children on row 1, etc.  

| Param | Type | Description |
| --- | --- | --- |
| selector | <code>string</code> | CSS selector for the child item to count per row. |

<a name="module_double-u.__Object+getShortest"></a>

#### __Object.getShortest() ⇒ <code>\_\_Object</code>
Finds the shortest (smallest pixel height, including padding and borders
but not margin) Element in the set of matched Elements.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
**Returns**: <code>\_\_Object</code> - Returns a new __Object for chaining that contains only
the shortest Element.  
<a name="module_double-u.__Object+keepFocusWithin"></a>

#### __Object.keepFocusWithin(containerSelector)
Prevents the tab key from focusing outside of the given element. There can
only be one element in the set of matched elements. You must use a string
selector for this (as opposed to an Element).

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Description |
| --- | --- | --- |
| containerSelector | <code>string</code> | CSS selector for the element to keep focus within. |

<a name="module_double-u.__Object+releaseFocus"></a>

#### __Object.releaseFocus()
There can only be one focus trap at a time, this function will delete it.
No element selector is required.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
<a name="module_double-u.__Object+debouncer"></a>

#### __Object.debouncer()
Returns a debouncer function. Usage:

````
let debouncer = __().debouncer(() => {}, 1000)

// will only first at most once after x time, no matter how many clicks within x time
element.addEventListener('click', debouncer)
````

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
<a name="module_double-u.__Object+throttler"></a>

#### __Object.throttler()
Returns a throttler function. Usage:

````
let throttler = __().throttler(() => {}, 1000)

// first click will fire immediately, then no clicks for x time
element.addEventListener('click', throttler)
````

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  
<a name="module_double-u.__Object+numberIsBetween"></a>

#### __Object.numberIsBetween(numberToCheck, min, max, [inclusive])
Checks if a number is between two other numbers.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| numberToCheck | <code>number</code> |  | The number to check. |
| min | <code>number</code> |  | The lower limit. |
| max | <code>number</code> |  | The upper limit. |
| [inclusive] | <code>boolean</code> | <code>true</code> | Whether the min and max themselves are considered valid numbers for the numberToCheck to be. Defaults to ture. |

<a name="module_double-u.__Object+chunk"></a>

#### __Object.chunk(chunkLength)
Chunks an array into smaller arrays of equal size, except for maybe the
last array chunk.

**Kind**: instance method of [<code>\_\_Object</code>](#module_double-u.__Object)  

| Param | Type | Default |
| --- | --- | --- |
| chunkLength | <code>number</code> | <code>10</code> | 

