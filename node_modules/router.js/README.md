# Router.js

*To see Router.js in action, check out the
[Cardinal apps](https://cardinalapps.xyz).*

Router.js is a dependency-free ES6 JavaScript library that provides
unopinionated MVC style router functionality for single-page apps.

An instance of the `Router` object is designed to live in the `window`, and it
will handle the state of any view window (DOM Element) that you give it.

## Features

- MVC architecture
- Navigation history
  - Refresh
  - Back
  - Forward
  - Configurable max number of items
  - Remembers scroll position for each page
- RESTful parameter substitution
- View caching (optimized for [Lowrider.js](https://github.com/somebeaver/Lowrider.js))
- Child routes
- Automatically handles `<a>`'s in the DOM
- Internationalization
  - Supports any number of languages
  - Can hot swap languages

## API Reference

A reference of all public Router.js methods is available in
**[DOCS.md](DOCS.md)**.

## Terminology

### `href`

The url to be parsed. Current lanauge will be maintained when a lang slug is not
present. Dynamic parts are expected to be mapped into values, eg.

```
`/artist/3` instead of `/artist/:id`
```

### `route`

The rule to check the `href` against. Each route supports each language
specified in `Router.langs`.

```
`/artist/:id`.
```

## MVC Architecture

Router.js loads pages with a loosely based MVC approach. For each route there is an
optional model, and a required view. Since Router.js is designed to be used with
Lowrider.js, it lets Lowrider.js components be the "C" in MVC.

- **M**: Your `.js` file defined by the route.
- **V**: Your `.html` file. Model data is made available to it.
- **C**: Web components that handle being loaded in the view with the model data.

## Routes

Routes should be defined as an array of objects. Example object:

```javascript
{
  "route": "/playlist/:id",
  "view": "playlist.html",
  "model": "playlist", // optional
  "parent": "/playlists" // optional
}
```

## Links

Linking to other views is easy, just add the class `router-link` to `<a>`'s.
Router.js will automatically handle event delegation for `<a>`'s that do not yet
exist in the DOM.

```html
<a href="/playlist/3" class="router-link">
  Go To Playlist 3
</a>
```

## Examples

### Initialization

```javascript
window.Router = new Router({
  'root': '#view',
  'mode': 'electron',
  'langs': ['en', 'fr'],
  'defaultLang': 'en',
  'cacheViews': true,
  'currentLang': 'en',
  'routes': [
    {
      "route": "/playlists",
      "view": "playlists.html"
    },
    {
      "route": "/playlist/:id",
      "view": "playlist.html",
      "model": "playlist",
      "parent": "/playlists"
    }
  ]
})
```

## License

Licensed under the Mozilla Public License 2.0.