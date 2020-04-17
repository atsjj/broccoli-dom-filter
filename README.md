# Broccoli Dom Filter

[![Latest npm release][npm-badge]][npm-badge-url]
[![TravisCI Build Status][travis-badge]][travis-badge-url]
[![GitHub Actions CI][github-actions-badge]][github-actions-ci-url]

[npm-badge]: https://img.shields.io/npm/v/broccoli-dom-filter.svg
[npm-badge-url]: https://www.npmjs.com/package/broccoli-dom-filter
[travis-badge]: https://img.shields.io/travis/atsjj/broccoli-dom-filter/master.svg?label=TravisCI
[travis-badge-url]: https://travis-ci.com/atsjj/broccoli-dom-filter
[github-actions-badge]: https://github.com/atsjj/broccoli-dom-filter/workflows/CI/badge.svg
[github-actions-ci-url]: https://github.com/atsjj/broccoli-dom-filter/actions?query=workflow%3ACI
[persistent-filter-url]: https://github.com/broccolijs/broccoli-persistent-filter
[persistent-filter-options-url]: https://github.com/broccolijs/broccoli-persistent-filter#options
[license-url]: LICENSE

Broccoli plugin for manipulating HTML with [jsdom](https://github.com/jsdom/jsdom).

## Usage

Add an [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element) in `app/index.html`:

```javascript
const BroccoliDomFilter = require('broccoli-dom-filter');

const filter = new BroccoliDomFilter('app', {
  files: ['index.html'],
  processors: [(jsdom => {
    const document = jsdom.window.document;
    const head = document.querySelector('head');
    const insertBefore = head.querySelector('title');
    const meta = document.createElement('meta');

    meta.setAttribute('name', 'test-name');
    meta.setAttribute('content', 'test-content');

    head.insertBefore(meta, insertBefore);

    return jsdom;
  })],
});
```

## Documentation

### `new BroccoliDomFilter(inputNodes, options)`

BroccoliDomFilter is a subclass of [BroccoliPersistentFilter][persistent-filter-url]
which has additional options available in the constructor. Please see
[*BroccoliPersistentFilter Options*][persistent-filter-options-url] for documentation.

* `inputNodes`: An array of node objects that this plugin will read from.
  Nodes are usually other plugin instances; they were formerly known as
  "trees".
* `options`
  * `files`: The list of files to process the list of patterns against. This is an array of strings.
  * `processors`: An array of callbacks that will process `jsdom` and return `jsdom`.
  * `processorOptions`: A context that can will be passed as the second argument to a processor.

### `function processor(jsdom, processorOptions = {})`

Processors allow you to modify the document currently being processed by `jsdom`. A processor
**MUST** take the `jsdom` argument and **MUST** return the `jsdom` argument. If you created an
instance of `BroccoliDomFilter` with `processorOptions`, that is provided to your processor as
the second argument, otherwise it will default to `{}`.

## Tests

```
npm install
npm test
```

## License

This project is licensed under the [MIT License][license-url].
