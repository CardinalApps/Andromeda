/**
 * @file
 * 
 * Helpers for forms.
 */
import __ from '../../double-u/index.js'
import i18n from '../../i18n.js/index.js'

const validationErrorClassName = 'validation-error'

/**
 * Given any form Element in the document, this will "prepare" every field by adding/wrapping
 * fields with the appropiate markup and attaching event listeners.
 * 
 * - `<select>` gets wrapped in `.form-select`.
 * - `input[type="checkbox"]` gets wrapped in `.toggle-switch`.
 * - `input[type="file"]` with `accept="image/*"` gets wrapped in `.photo-input`.
 * - `input[type="text"]`, `input[type="number"]`, and `textarea` get wrapped in `.text-input`.
 * - `input[type="number"]` gets support for the `maxlength` attr which otherwise only applies to textual inputs, and gets support for `min` and `max` value valudation on blur.
 * - `select[name="genres"]` will automatically be populated with all genres from the database.
 * - Any Element matching `.hidden-fields` will be hidden visually only (**not** display:none), and automatically shown when the form gets the class `show`.
 * - A handler gets attached to the form reset properly resets Electon chosen files and other fields.
 * 
 * This will only effect the Elements that exist in the document at the time it's called, and
 * the form won't be watched for new fields afterwards. However it is safe to call this function
 * on the same form multiple times - it won't touch fields that are already "prepared".
 * 
 * All inputs remain exposed and focusable in their semantic document position.
 */
export function prepare(formEl) {
  // child fields
  prepareSelects(formEl)
  //await prepareGenreSelects(formEl)
  prepareCheckboxes(formEl)
  prepareRadios(formEl)
  prepareFilePickers(formEl)
  prepareNumberInputs(formEl)
  prepareTextualInputs(formEl)
  
  // functionality
  prepareHiddenFields(formEl)

  // form events
  formListenForReset(formEl)
  formListenForSuccess(formEl)
}

/**
 * Wraps all `<select>`'s in `.form-select`. Supports `data-label`.
 * 
 * @param {Element} formEl - Form Element to find fields in.
 */
function prepareSelects(formEl) {
  __(formEl).find('select').each((select) => {
    // wrapping might have been done on a previous pass
    if (__(select).closest('.form-select').els.length) return
    
    let selectClass = __(select).hasAttr('multiple') ? 'form-multi-select' : 'form-select'
    let labelHtml = __(select).attr('data-label') ? /*html*/`<span class="label-text">${__(select).attr('data-label')}</span>` : ''

    // inject
    let selectField = __(select).before(/*html*/`
      <div class="field ${selectClass}">
        ${labelHtml}
        <div class="select-outer"></div>
      </div>`)

    __(select).moveTo(selectField.find('.select-outer').el())
  })
}

/**
 * Wraps all `<input type="checkbox">`'s in `.toggle-switch`'s. Supports `data-label` and `data-align`.
 * 
 * @param {Element} formEl - Form Element to find fields in.
 */
function prepareCheckboxes(formEl) {
  __(formEl).find('input[type="checkbox"]').each((checkbox) => {
    // wrapping might have been done on a previous pass
    if (__(checkbox).closest('.toggle-switch').els.length) return
    let label = __(checkbox).attr('data-label')
    let align = __(checkbox).attr('data-align') ? __(checkbox).attr('data-align') : 'left' // default to left alignment
    let explanation = __(checkbox).attr('data-explanation') ? __(checkbox).attr('data-explanation') : false
    let tooltipHtml = ''
    
    if (explanation) {
      tooltipHtml = /*html*/`<i class="explanation tooltip far fa-question-circle" data-tooltip="${explanation}"></i>`
    }

    let toggleSwitchHtml = /*html*/`
      <div class="field toggle-switch-field align-${align}">
        <label>
          <div class="toggle-switch">
            <div class="switch"></div>
            <div class="focus"></div>
          </div>
        </label>
        <span class="label-text">${tooltipHtml}${label}</span>
      </div>`

    // insert .toggle-switch before the checkbox
    let toggleSwitch = __(checkbox).before(toggleSwitchHtml)

    // move the checkbox into the toggle switch
    let moveToSibling = toggleSwitch.find('.switch').el()
    __(checkbox).moveTo(moveToSibling, 'beforebegin')
  })
}

/**
 * Wraps all `<input type="radio">`'s in `.radio`'s.
 * 
 * @param {Element} formEl - Form Element to find fields in.
 */
function prepareRadios(formEl) {
  __(formEl).find('input[type="radio"]').each((radioInput) => {
    // wrapping might have been done on a previous pass
    if (__(radioInput).closest('.radio-field').els.length) return

    let label = __(radioInput).attr('data-label') || ''
    
    // special case: color swatches
    let color = __(radioInput).hasClass('color-swatch') ? `style="background-color:${__(radioInput).attr('value')};"` : ''

    let html = /*html*/`
      <div class="field radio-field">
        <label class="clicks" ${color}></label>
        <span class="label-text">${label}</span>
      </div>`

    let radioField = __(radioInput).before(html)

    // move the checkbox into the toggle switch
    let moveToSibling = radioField.find('label').el()
    __(radioInput).moveTo(moveToSibling, 'afterbegin')
  })
}

/**
 * Wraps `<input type="file" accept"image/*">` in `.photo-input`.
 * 
 * @param {Element} formEl - Form Element to find fields in.
 */
function prepareFilePickers(formEl) {
  __(formEl).find('input[type="file"]').each((fileEl) => {
    // wrapping might have been done on a previous pass
    if (__(fileEl).closest('.photo-input').els.length) return

    // image file picker gets wrapped in .photo-input
    if (__(fileEl).attr('accept') === 'image/*') {
      __(fileEl).wrapInto(/*html*/`<div class="photo-input field"></div>`)
      __(fileEl).wrapInto(/*html*/`<label></label>`)
      let photoInput = __(fileEl).closest(`.photo-input`)
      let labelText = __(fileEl).attr('data-label')
      let buttonText = i18n('choose-file')

      // helper function that resets the state of this photo input
      const restoreOriginalState = () => {
        let originalThumb = __(fileEl).attr('data-original-value')

        // restore the original thumbnail, like restoring the original text of
        // textual fields
        if (originalThumb) {
          photoInput.find('.thumb').attr('style', `background-image: url('${__().__doubleSlashesOnWindowsOnly(originalThumb)}')`)
        }
        // restore to the "no-thumb" state
        else {
          photoInput.find('.thumb').removeAttr('style')
          photoInput.find('input[type="file"]').removeAttr('data-value')
        }
      }

      // build the html
      photoInput.prependHtml(/*html*/`<span class="label-text">${labelText}</span>`)
      photoInput.find('label').appendHtml(/*html*/`
        <div class="thumb">
          <span class="btn">${buttonText}</span>
        </div>
      `)
      photoInput.find('.thumb').appendHtml(/*html*/`
        <button type="button" class="remove-photo icon-button">
          <span tabindex="-1">
            <i class="fas fa-times-circle"></i>
          </span>
        </button>
      `)

      // if the photo picker already has a value
      if (__(fileEl).attr('data-value')) {
        let path = __(fileEl).attr('data-value')
        photoInput.find('.thumb').attr('style', `background-image: url('${__().__doubleSlashesOnWindowsOnly(path)}')`)
        __(fileEl).attr('data-original-value', path)
      }

      // attach a handler to the file picker that updates the thumbnail
      fileEl.addEventListener('change', (event) => {
        let fileList = __(fileEl).value()

        // the user selected an image, set it directly as the thumb
        if (fileList instanceof FileList) {
          let selectedImage = fileList[0]
          photoInput.find('.thumb').attr('style', `background-image: url('${__().__doubleSlashesOnWindowsOnly(selectedImage.path)}')`)
          __(fileEl).attr('data-value', selectedImage.path)
        } 
        // the user backed out of the file selector without choosing an image
        else {
          restoreOriginalState()
        }
      })

      // attach a handler that resets the thumbnail
      photoInput.find('.remove-photo').el().addEventListener('click', (event) => {
        photoInput.find('.thumb').removeAttr('style')
        photoInput.find('input[type="file"]').el().value = null
        photoInput.find('input[type="file"]').attr('data-value', '')
      })
    }
  })
}

/**
 * Wraps `input`'s with the type `text` or `number`, and `textarea`'s in `.text-input`.
 * 
 * @param {Element} formEl - Form Element to find fields in.
 */
function prepareTextualInputs(formEl) {
  __(formEl).find('input[type="text"], input[type="number"], textarea').each((inputEl) => {
    // wrapping might have been done on a previous pass
    if (__(inputEl).closest('.text-input').els.length) return

    let input = __(inputEl).wrapInto(/*html*/`<label class="text-input"></label>`).el()
    let labelText = __(input).attr('data-label')

    if (labelText) {
      __(input).closest('.text-input').prependHtml(/*html*/`<span class="label-text">${labelText}</span>`)
    } else {
      __(input).addClass('no-label')
    }
  })
}

/**
 * Adds functionality to all `<input>`'s with the type `number`.
 */
function prepareNumberInputs(formEl) {
  /**
 * Add maxlength functionality which doesn't exist in the browser
 */
  __(formEl).find('input[type="number"][maxlength]').each((el) => {
    el.addEventListener('change', (event) => {
      let userSetValue = parseInt(__(el).value()) // the value that was just set by the user and might be disallowed
      let maxLength = parseInt(__(el).attr('maxlength'))

      // if longer than the maxlength, truncate to that length
      if (userSetValue.length > maxLength) {
        userSetValue = parseInt(userSetValue.substring(0, maxLength))
      }

      el.value = userSetValue
    })
  })

  /**
 * On field blur, if the number that the user entered is outside of the min/max, round it to min or max
 */
  __(formEl).find('input[type="number"][min], input[type="number"][max]').each((el) => {
    el.addEventListener('change', (event) => {
      let userSetValue = parseInt(__(el).value()) // the value that was just set by the user and might be disallowed
      let min = __(el).attr('min') ? parseInt(__(el).attr('min')) : 0
      let max = __(el).attr('max') ? parseInt(__(el).attr('max')) : Number.MAX_SAFE_INTEGER

      // if there is a set minimum and this is below it, become the min
      if (min && userSetValue < min) {
        userSetValue = min
      }

      // if there is a set maximum and this is above it, become the max
      if (max && userSetValue > max) {
        userSetValue = max
      }

      el.value = userSetValue
    })
  })
}

/**
 * Hidden fields
 */
function prepareHiddenFields(formEl) {
  /**
 * Loop all .hidden-fields elements and disable the tabindex of all child fields. Also add an observer
 * that reenables the tabindex when the .hidden-fields element is shown.
 */
  __(formEl).find('.hidden-fields').each((parent) => {
    let childElementsSelector = 'input, select, textarea, button, a'

    // disable all child element tab index
    __(parent).find(childElementsSelector).attr('tabindex', '-1')

    // create observer
    const hiddenFormFieldsTabIndexObserver = new MutationObserver((mutations) => {
      if (__(parent).hasClass('show')) {
        __(parent).find(childElementsSelector).removeAttr('tabindex')
      } else {
        __(parent).find(childElementsSelector).attr('tabindex', '-1')
      }
    })
    hiddenFormFieldsTabIndexObserver.observe(parent, {'attributes': true, 'attributeFilter': ['class']})
  })
}

/**
 * Attaches an event handler for the form reset.
 */
function formListenForReset(formEl) {
  formEl.addEventListener('reset', (event) => {
    // the reset event will automatically reset the "value" attribute of the file input, but that's not where
    // Electron stores the real file data. that's just where webkit puts the fake path for the web.
    __(formEl).find('.photo-input').each((photoInputEl) => {
      let fileEl = photoInputEl.querySelector('input[type="file"]')

      // reset back to the originl image, if there was one
      if (__(fileEl).attr('data-original-value')) {
        let original = __(fileEl).attr('data-original-value')

        __(fileEl).attr('data-value', original)
        __(photoInputEl).find('.thumb').attr('style', `background-image: url('${__().__doubleSlashesOnWindowsOnly(original)}')`)
      }

      // Something funky is going on here, and my suspicion is that it's related to how Electron handles the special FileList
      // that exposes real file paths on the local file system.
      // The `files` property is a special property that exists only in the Electron distribution of Webkit, and its value
      // is a FileList. FileList's are read-only, so it's not possible to reset its length to 0. It's also not possible to
      // manually create a new FileList.
      //
      // So instead it gets overwritten to null here... but, that action seems to take an entire tick to happen, and the
      // dispatched event below would trigger the event listeners before the `files` property was nullified.
      // It seems like Electron watches this property and resets it to an empty FileList when it sees that it's null,
      // that's my best guess. Waiting for the next tick allows this to happen, and all event listeners will see an empty
      // FileList after the event is dispatched.
      fileEl.files = null

      // trigger the change event in the next tick
      setTimeout(() => {
        let changeEvent = new Event('change', {"bubbles": true})
        fileEl.dispatchEvent(changeEvent)
      }, 0)
    })
  })
}

/**
 * When the class "success" is added to the form, do an animation, then remove the success class
 * after a few seconds.
 */
function formListenForSuccess(formEl) {
  __(formEl).watchAttrs(['class'], (change) => {
    let form = __(formEl)

    if (form.hasClass('success')) {
      // add the svg
      form.find('button[type="submit"]').prependHtml(/*html*/`
        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
          <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>`)

      // in a few seconds, exit success state
      setTimeout(() => {
        // form might have been removed from DOM during timeout
        if (form) {
          form.find('.checkmark').remove()
          form.removeClass('success')
        }
      }, 2000)
    }
  })
}

/**
 * Validates all form fields and/or form Elements in the set of matched
 * Elements. Form Elements will have all of their child fields validated.
 *
 * This will automatically add classes and attach event listeners to invalid
 * fields that check for when the field is no longer invalid, and when so,
 * will remove the event handler and classes.
 *
 * It is safe to call validate() over and over (if the user spams the submit
 * button) without creating duplicate handlers.
 *
 * @param {*} selector - Selector for __.
 * @returns {(boolean|null)} Returns true if all fields are valid, or false if
 * any are invalid. Returns null if no fields were found in the DOM, which
 * signifies that no validation was performed.
 */
export function validate(selector) {
  let result = true // will change to false if any field is invalid
  let fieldsToValidate = []
  let requiredClassName = 'req'
  

  // gather all the Elements that we need to validate
  __(selector).each((el) => {
    // if its a form, we need to validate all child Elements
    if (el.matches('form')) {
      // remove previously generated errors since this is a new validation
      __(el).find('.submission-error').remove()

      // find all inputs in the form
      __(el).find('input, select, textarea').each((formChildEl) => {
        fieldsToValidate.push(formChildEl)
      })
    } else {
      fieldsToValidate.push(el)
    }
  })

  // if there are no fields to validate, validation cannot occur, so return null
  if (!fieldsToValidate.length) return null

  // validate each required field
  for (let fieldEl of fieldsToValidate) {
    let field = __(fieldEl)
    let fieldParent = field.closest('.field')
    let fieldIsValid = true

    // the field may already be invalid from a previous validation, which means that it's still invalid
    if (fieldParent.hasClass(validationErrorClassName)) {
      result = false
      continue
    }

    // only check required fields
    if (!field.hasClass(requiredClassName)) continue

    //console.log('Validating field', fieldEl)

    // validate <textarea>
    if (fieldEl.matches('textarea')) {
      if (field.value().trim() === '') fieldIsValid = false
    }

    // validate <select>
    if (fieldEl.matches('select')) {
      if (field.value().trim() === '') fieldIsValid = false
    }

    // validate <input type="text">
    if (fieldEl.matches('input') && field.attr('type') === 'text') {
      if (field.value().trim() === '') fieldIsValid = false
    }

    // validate <input type="file">
    if (fieldEl.matches('input') && field.attr('type') === 'file') {
      if (!fieldEl.files || !fieldEl.files.length) fieldIsValid = false
    }

    //console.log('Validation result:', fieldIsValid)

    // if a field was invalid, the validation will return false
    if (!fieldIsValid) {
      fieldParent.addClass(validationErrorClassName)

      // these fields get a blur handler...
      if (fieldEl.matches('textarea') || fieldEl.matches('input[type="text"]')) {
        fieldEl.addEventListener('blur', validationErrorOnBlurHandler)
      }

      result = false
    }
  }

  /**
 * This will get attached to text fields that have a validation error. On blur of that field,
 * this will check if the error should still exist, and if not, it will remove the error class
 * and self destruct this event listener.
 */
  function validationErrorOnBlurHandler(event) {
    // if not empty anymore, exit error state
    if (__(event.target).value()) {
      __(event.target).closest('.'+validationErrorClassName).removeClass(validationErrorClassName)
      event.target.removeEventListener('blur', validationErrorOnBlurHandler)
    }
  }

  return result
}

/**
 * Clears all validation classes from a form. This doesn't *need* to be
 * called, because the event listeners automatically created by validate()
 * should handle everything.
 * 
 * @param {*} selector - Selector for __.
 */
export function clearValidation(selector) {
  __(selector).each((el) => {
    __(el).find(validationErrorClassName).removeClass(validationErrorClassName)
    __(el).find('.submission-error').remove()
  })
}

/**
 * Returns all values from a form, empty or not. This method expects exactly
 * one form Element in the set of matched Elements.
 *
 * This will also add the following properties to the return object for
 * convienence:
 *
 * - If the fields `date-dd`, `date-mm`, `date-yyyy` all exist in the form and
 *   are not empty, their values will be used to add these new properties:
 *   `date-ms` and `date-dd-mm-yyyy`.
 *
 * @returns {object} Returns an object where keys are the field names and the
 * values are the field values.
 */
export function getValues(formEl) {
  let values = {}

  // pull each field value out
  __(formEl).find('input, select, textarea').each((el) => {
    values[__(el).attr('name')] = __(el).value()
  })
  
  // if the date dd-mm-yyyy fields exist
  if (__(formEl).find('input[name="date-dd"]').els.length && __(formEl).find('input[name="date-mm"]').els.length && __(formEl).find('input[name="date-yyyy"]').els.length) {
    let day = __(formEl).find('input[name="date-dd"]').value()
    let month = __(formEl).find('input[name="date-mm"]').value()
    let year = __(formEl).find('input[name="date-yyyy"]').value()

    if (day && month && year) {
      values['date-ms'] = Date.parse(`${year}-${month}-${day}`)
      values['date-dd-mm-yyyy'] = `${day}-${month}-${year}`
    }
  }

  // convert File objects to simpler objects
  for(let [name, value] of Object.entries(values)) {
    if (value instanceof FileList) {
      for (let i = 0; i < value.length; i++ ) {
        let file = value.item(i)
        
        // set the original value to the path string
        values[name] = file.path
        //values[`${name}-original`] = file
      }
    }
  }

  return values
}