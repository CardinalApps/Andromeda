## Functions

<dl>
<dt><a href="#prepare">prepare()</a></dt>
<dd><p>Given any form Element in the document, this will &quot;prepare&quot; every field by adding/wrapping
fields with the appropiate markup and attaching event listeners.</p>
<ul>
<li><code>&lt;select&gt;</code> gets wrapped in <code>.form-select</code>.</li>
<li><code>input[type=&quot;checkbox&quot;]</code> gets wrapped in <code>.toggle-switch</code>.</li>
<li><code>input[type=&quot;file&quot;]</code> with <code>accept=&quot;image/*&quot;</code> gets wrapped in <code>.photo-input</code>.</li>
<li><code>input[type=&quot;text&quot;]</code>, <code>input[type=&quot;number&quot;]</code>, and <code>textarea</code> get wrapped in <code>.text-input</code>.</li>
<li><code>input[type=&quot;number&quot;]</code> gets support for the <code>maxlength</code> attr which otherwise only applies to textual inputs, and gets support for <code>min</code> and <code>max</code> value valudation on blur.</li>
<li><code>select[name=&quot;genres&quot;]</code> will automatically be populated with all genres from the database.</li>
<li>Any Element matching <code>.hidden-fields</code> will be hidden visually only (<strong>not</strong> display:none), and automatically shown when the form gets the class <code>show</code>.</li>
<li>A handler gets attached to the form reset properly resets Electon chosen files and other fields.</li>
</ul>
<p>This will only effect the Elements that exist in the document at the time it&#39;s called, and
the form won&#39;t be watched for new fields afterwards. However it is safe to call this function
on the same form multiple times - it won&#39;t touch fields that are already &quot;prepared&quot;.</p>
<p>All inputs remain exposed and focusable in their semantic document position.</p>
</dd>
<dt><a href="#prepareSelects">prepareSelects(formEl)</a></dt>
<dd><p>Wraps all <code>&lt;select&gt;</code>&#39;s in <code>.form-select</code>. Supports <code>data-label</code>.</p>
</dd>
<dt><a href="#prepareCheckboxes">prepareCheckboxes(formEl)</a></dt>
<dd><p>Wraps all <code>&lt;input type=&quot;checkbox&quot;&gt;</code>&#39;s in <code>.toggle-switch</code>&#39;s. Supports <code>data-label</code> and <code>data-align</code>.</p>
</dd>
<dt><a href="#prepareRadios">prepareRadios(formEl)</a></dt>
<dd><p>Wraps all <code>&lt;input type=&quot;radio&quot;&gt;</code>&#39;s in <code>.radio</code>&#39;s.</p>
</dd>
<dt><a href="#prepareFilePickers">prepareFilePickers(formEl)</a></dt>
<dd><p>Wraps <code>&lt;input type=&quot;file&quot; accept&quot;image/*&quot;&gt;</code> in <code>.photo-input</code>.</p>
</dd>
<dt><a href="#prepareTextualInputs">prepareTextualInputs(formEl)</a></dt>
<dd><p>Wraps <code>input</code>&#39;s with the type <code>text</code> or <code>number</code>, and <code>textarea</code>&#39;s in <code>.text-input</code>.</p>
</dd>
<dt><a href="#prepareNumberInputs">prepareNumberInputs()</a></dt>
<dd><p>Adds functionality to all <code>&lt;input&gt;</code>&#39;s with the type <code>number</code>.</p>
</dd>
<dt><a href="#prepareHiddenFields">prepareHiddenFields()</a></dt>
<dd><p>Hidden fields</p>
</dd>
<dt><a href="#formListenForReset">formListenForReset()</a></dt>
<dd><p>Attaches an event handler for the form reset.</p>
</dd>
<dt><a href="#formListenForSuccess">formListenForSuccess()</a></dt>
<dd><p>When the class &quot;success&quot; is added to the form, do an animation, then remove the success class
after a few seconds.</p>
</dd>
<dt><a href="#validate">validate(selector)</a> ⇒ <code>boolean</code> | <code>null</code></dt>
<dd><p>Validates all form fields and/or form Elements in the set of matched
Elements. Form Elements will have all of their child fields validated.</p>
<p>This will automatically add classes and attach event listeners to invalid
fields that check for when the field is no longer invalid, and when so,
will remove the event handler and classes.</p>
<p>It is safe to call validate() over and over (if the user spams the submit
button) without creating duplicate handlers.</p>
</dd>
<dt><a href="#clearValidation">clearValidation(selector)</a></dt>
<dd><p>Clears all validation classes from a form. This doesn&#39;t <em>need</em> to be
called, because the event listeners automatically created by validate()
should handle everything.</p>
</dd>
<dt><a href="#getValues">getValues()</a> ⇒ <code>object</code></dt>
<dd><p>Returns all values from a form, empty or not. This method expects exactly
one form Element in the set of matched Elements.</p>
<p>This will also add the following properties to the return object for
convienence:</p>
<ul>
<li>If the fields <code>date-dd</code>, <code>date-mm</code>, <code>date-yyyy</code> all exist in the form and
are not empty, their values will be used to add these new properties:
<code>date-ms</code> and <code>date-dd-mm-yyyy</code>.</li>
</ul>
</dd>
</dl>

<a name="prepare"></a>

## prepare()
Given any form Element in the document, this will "prepare" every field by adding/wrapping
fields with the appropiate markup and attaching event listeners.

- `<select>` gets wrapped in `.form-select`.
- `input[type="checkbox"]` gets wrapped in `.toggle-switch`.
- `input[type="file"]` with `accept="image/*"` gets wrapped in `.photo-input`.
- `input[type="text"]`, `input[type="number"]`, and `textarea` get wrapped in `.text-input`.
- `input[type="number"]` gets support for the `maxlength` attr which otherwise only applies to textual inputs, and gets support for `min` and `max` value valudation on blur.
- `select[name="genres"]` will automatically be populated with all genres from the database.
- Any Element matching `.hidden-fields` will be hidden visually only (**not** display:none), and automatically shown when the form gets the class `show`.
- A handler gets attached to the form reset properly resets Electon chosen files and other fields.

This will only effect the Elements that exist in the document at the time it's called, and
the form won't be watched for new fields afterwards. However it is safe to call this function
on the same form multiple times - it won't touch fields that are already "prepared".

All inputs remain exposed and focusable in their semantic document position.

**Kind**: global function  
<a name="prepareSelects"></a>

## prepareSelects(formEl)
Wraps all `<select>`'s in `.form-select`. Supports `data-label`.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| formEl | <code>Element</code> | Form Element to find fields in. |

<a name="prepareCheckboxes"></a>

## prepareCheckboxes(formEl)
Wraps all `<input type="checkbox">`'s in `.toggle-switch`'s. Supports `data-label` and `data-align`.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| formEl | <code>Element</code> | Form Element to find fields in. |

<a name="prepareRadios"></a>

## prepareRadios(formEl)
Wraps all `<input type="radio">`'s in `.radio`'s.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| formEl | <code>Element</code> | Form Element to find fields in. |

<a name="prepareFilePickers"></a>

## prepareFilePickers(formEl)
Wraps `<input type="file" accept"image/*">` in `.photo-input`.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| formEl | <code>Element</code> | Form Element to find fields in. |

<a name="prepareTextualInputs"></a>

## prepareTextualInputs(formEl)
Wraps `input`'s with the type `text` or `number`, and `textarea`'s in `.text-input`.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| formEl | <code>Element</code> | Form Element to find fields in. |

<a name="prepareNumberInputs"></a>

## prepareNumberInputs()
Adds functionality to all `<input>`'s with the type `number`.

**Kind**: global function  
<a name="prepareHiddenFields"></a>

## prepareHiddenFields()
Hidden fields

**Kind**: global function  
<a name="formListenForReset"></a>

## formListenForReset()
Attaches an event handler for the form reset.

**Kind**: global function  
<a name="formListenForSuccess"></a>

## formListenForSuccess()
When the class "success" is added to the form, do an animation, then remove the success class
after a few seconds.

**Kind**: global function  
<a name="validate"></a>

## validate(selector) ⇒ <code>boolean</code> \| <code>null</code>
Validates all form fields and/or form Elements in the set of matched
Elements. Form Elements will have all of their child fields validated.

This will automatically add classes and attach event listeners to invalid
fields that check for when the field is no longer invalid, and when so,
will remove the event handler and classes.

It is safe to call validate() over and over (if the user spams the submit
button) without creating duplicate handlers.

**Kind**: global function  
**Returns**: <code>boolean</code> \| <code>null</code> - Returns true if all fields are valid, or false if
any are invalid. Returns null if no fields were found in the DOM, which
signifies that no validation was performed.  

| Param | Type | Description |
| --- | --- | --- |
| selector | <code>\*</code> | Selector for __. |

<a name="validate..validationErrorOnBlurHandler"></a>

### validate~validationErrorOnBlurHandler()
This will get attached to text fields that have a validation error. On blur of that field,
this will check if the error should still exist, and if not, it will remove the error class
and self destruct this event listener.

**Kind**: inner method of [<code>validate</code>](#validate)  
<a name="clearValidation"></a>

## clearValidation(selector)
Clears all validation classes from a form. This doesn't *need* to be
called, because the event listeners automatically created by validate()
should handle everything.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| selector | <code>\*</code> | Selector for __. |

<a name="getValues"></a>

## getValues() ⇒ <code>object</code>
Returns all values from a form, empty or not. This method expects exactly
one form Element in the set of matched Elements.

This will also add the following properties to the return object for
convienence:

- If the fields `date-dd`, `date-mm`, `date-yyyy` all exist in the form and
  are not empty, their values will be used to add these new properties:
  `date-ms` and `date-dd-mm-yyyy`.

**Kind**: global function  
**Returns**: <code>object</code> - Returns an object where keys are the field names and the
values are the field values.  
