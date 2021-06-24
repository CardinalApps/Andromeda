# __ ("double-u")

*To see double-u in action, check out the
[Cardinal apps](https://cardinalapps.xyz).* 

`__` is a jQuery-inspired library for DOM manipulations and general helpers made
for the UI of Cardinal client apps. It accepts any CSS3 seclector, Element (DOM
Node), DocumentFragment, NodeList, or array of such things. It returns an
instance of `__Object` ("double-u object"), which is the class that contains the
helper methods.

## API Reference

A reference of all public double-u methods is available in
**[DOCS.md](DOCS.md)**.

## Notable Properties

There are two especially notable `__Object` properties:

  - **`els`**: ("elements") property which contains an array of Elements that were
    found with the given selector. An empty `els` array means that the given
    selector did not match anything in the DOM (same as checking the `length'
    property of a jQuery object).

  - **`selector`**: The selector being used for this instance. Keep in mind that
    `selector` can change when chaining methods.

Most helper methods will work as expected when the `__Object` has multiple
Elements in its `.els` array, but some are designed specifically for when there
is only a single Element in the array. Depending on the method, `__()` may throw a
warning, error, or remain silent. Other methods are designed to work with no
elements in the DOM. Each method specifies what is expects.

## Initializing

```javascript
// using a CSS selector
let items = __('.item')

if (items.els.length) {
  // Elements were found in the DOM
} else {
  // nothing was found in the DOM
}

// using a single Element
let app = document.querySelector('#app')
__(app).addClass('loaded')

// using multiple Elements
let thumbs = document.querySelectorAll('.thumb')
__(thumbs).addClass('show')

// using a DocumentFragment
let template = __('#app').getTemplate('.menu-item')
__(template).find('a').attr('href', '/home')
__('.menu').after(template)

// can also be initialized with nothing
let shuffled = __().shuffle(['dog', 'cat'])
```

## Chaining

All methods are chainable unless otherwise specified.

```javascript
__('.foo').find('.bar').addClass('loading').attr('data-message', msg).each((el) => {})
```

## License

Licensed under the Mozilla Public License 2.0.