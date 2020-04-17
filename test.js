'use strict';

const { BroccoliDomFilterPatternError } = require('./errors');
const { createBuilder, createTempDir } = require('broccoli-test-helper');
const { JSDOM } = require('jsdom');
const { Minimatch } = require('minimatch');
const BroccoliDomFilter = require('.');
const sinon = require('sinon');
const test = require('ava');

function createFilter(assert, options = {}) {
  return new BroccoliDomFilter(assert.context.input.path(), options);
}

const indexHtml = `
<!doctype html>
<html class="no-js" lang="">
  <head>
    <meta charset="utf-8">
    <title>Hello World</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="css/normalize.css">
    <link rel="stylesheet" href="css/main.css">
  </head>
  <body>
    <!-- Add your site or application content here -->
    <p>Hello world! This is HTML5 Boilerplate.</p>
  </body>
</html>
`;

let expectedIndexHtml = '';
expectedIndexHtml += `<!DOCTYPE html><html class="no-js" lang=""><head>\n`;
expectedIndexHtml += `    <meta charset="utf-8">\n`;
expectedIndexHtml += `    <meta name="test-name" content="test-content"><title>Hello World</title>\n`;
expectedIndexHtml += `    <meta name="description" content="">\n`;
expectedIndexHtml += `    <meta name="viewport" content="width=device-width, initial-scale=1">\n`;
expectedIndexHtml += `    <link rel="stylesheet" href="css/normalize.css">\n`;
expectedIndexHtml += `    <link rel="stylesheet" href="css/main.css">\n`;
expectedIndexHtml += `  </head>\n`;
expectedIndexHtml += `  <body>\n`;
expectedIndexHtml += `    <!-- Add your site or application content here -->\n`;
expectedIndexHtml += `    <p>Hello world! This is HTML5 Boilerplate.</p>\n`;
expectedIndexHtml += `  \n`;
expectedIndexHtml += `\n`;
expectedIndexHtml += `</body></html>`;

test.beforeEach(async assert => {
  const input = await createTempDir();

  input.write({
    'index.html': indexHtml,
    path: {
      to: {
        files: {
          'index.html': indexHtml,
        }
      }
    }
  });

  assert.context.input = input;
});

test.afterEach(async assert => {
  await assert.context.input.dispose();
});

test('produces correct toString result', async assert => {
  assert.is(createFilter(assert).toString(), '[broccoli-persistent-filter:BroccoliDomFilter]');
  assert.is(createFilter(assert, { annotation: 'some-annotation' }).toString(),
    '[broccoli-persistent-filter:BroccoliDomFilter > [some-annotation]: some-annotation]');
});

test('options allow files as strings converts into Minimatch', async assert => {
  const filter = createFilter(assert, { files: ['index.html'] });

  assert.is(filter.files.length, 1);
  assert.true(filter.files[0] instanceof Minimatch);
});

test('options allow files as RegExp pattern', async assert => {
  const filter = createFilter(assert, { files: [/index\.html/] });

  assert.is(filter.files.length, 1);
  assert.true(filter.files[0] instanceof RegExp);
});

test('options throws if files contains bad types', async assert => {
  const expectedThrow = { instanceOf: BroccoliDomFilterPatternError };

  assert.throws(() => createFilter(assert, { files: [1] }), expectedThrow);
  assert.throws(() => createFilter(assert, { files: [true] }), expectedThrow);
});

test('options allow files as callbacks', async assert => {
  const filter = createFilter(assert, { files: [(() => 'index.html')] });

  assert.is(filter.files.length, 1);
  assert.is(typeof filter.files[0], 'function');
});

test('options allow processorOptions as any', async assert => {
  const filterA = createFilter(assert, { processorOptions: 'anything' });
  const filterB = createFilter(assert, { processorOptions: ['anything'] });
  const filterC = createFilter(assert, { processorOptions: { any: 'thing' } });

  assert.is(filterA.processorOptions, 'anything');
  assert.deepEqual(filterB.processorOptions, ['anything']);
  assert.deepEqual(filterC.processorOptions, { any: 'thing' });
});

test('options allow processors as callbacks', async assert => {
  const filter = createFilter(assert, { processors: [(() => null)] });

  assert.is(filter.processors.length, 1);
  assert.is(typeof filter.processors[0], 'function');
});

test('canProcessFile matches on Minimatch', async assert => {
  const filter = createFilter(assert, { files: ['index.html'] });

  assert.true(filter.canProcessFile('index.html'));
  assert.false(filter.canProcessFile('path/to/files/index.html'));
  assert.false(filter.canProcessFile('index.css'));
  assert.false(filter.canProcessFile('path/to/files/index.css'));
});

test('canProcessFile matches on RegExp', async assert => {
  const filter = createFilter(assert, { files: [/index\.html/] });

  assert.true(filter.canProcessFile('index.html'));
  assert.true(filter.canProcessFile('path/to/files/index.html'));
  assert.false(filter.canProcessFile('index.css'));
  assert.false(filter.canProcessFile('path/to/files/index.css'));
});

test('canProcessFile matches on callbacks', async assert => {
  const filterA = createFilter(assert, { files: [() => true] });
  const filterB = createFilter(assert, { files: [() => false] });

  assert.true(filterA.canProcessFile('index.html'));
  assert.true(filterA.canProcessFile('path/to/files/index.html'));
  assert.true(filterA.canProcessFile('index.css'));
  assert.true(filterA.canProcessFile('path/to/files/index.css'));
  assert.false(filterB.canProcessFile('index.html'));
  assert.false(filterB.canProcessFile('path/to/files/index.html'));
  assert.false(filterB.canProcessFile('index.css'));
  assert.false(filterB.canProcessFile('path/to/files/index.css'));
});

test('getDestFilePath always returns relativePath', async assert => {
  const filter = createFilter(assert);

  assert.is(filter.getDestFilePath('index.html'), 'index.html');
  assert.is(filter.getDestFilePath('path/to/files/index.html'), 'path/to/files/index.html');
  assert.is(filter.getDestFilePath('index.css'), 'index.css');
  assert.is(filter.getDestFilePath('path/to/files/index.css'), 'path/to/files/index.css');
});

test('processDocument is not called when there are no processors', async assert => {
  const filter = createFilter(assert, { files: [() => true] });
  const builder = createBuilder(filter);

  sinon.spy(filter, 'processDocument');

  await builder.build();
  await builder.dispose();

  assert.is(filter.processDocument.callCount, 0);
});

test('processDocument is called when there are processors', async assert => {
  const filter = createFilter(assert, { files: ['index.html'], processors: [(jsdom => jsdom)] });
  const builder = createBuilder(filter);

  sinon.spy(filter, 'processDocument');

  await builder.build();
  await builder.dispose();

  assert.is(filter.processDocument.callCount, 1);
});

test('processString is not called when no files match', async assert => {
  const filter = createFilter(assert, { files: [() => false] });
  const builder = createBuilder(filter);

  sinon.spy(filter, 'processString');

  await builder.build();
  await builder.dispose();

  assert.is(filter.processString.callCount, 0);
});

test('processString is not called when files match', async assert => {
  const filter = createFilter(assert, { files: [() => true] });
  const builder = createBuilder(filter);

  sinon.spy(filter, 'processString');

  await builder.build();
  await builder.dispose();

  assert.is(filter.processString.callCount, 2);
});

test('processString yields JSDOM and processorOptions to callbacks', async assert => {
  let actualJsdom;
  let actualProcessorOptions;

  const processor = (jsdom, processorOptions) => {
    actualJsdom = jsdom;
    actualProcessorOptions = processorOptions;

    return jsdom;
  };

  const filter = createFilter(assert, {
    files: ['index.html'],
    processors: [processor],
    processorOptions: 'anything',
  });

  const builder = createBuilder(filter);

  await builder.build();
  await builder.dispose();

  assert.is(actualProcessorOptions, 'anything');
  assert.true(actualJsdom instanceof JSDOM);
});

test('processString returns html without processors', async assert => {
  const filter = createFilter(assert, { files: ['index.html'] });
  const builder = createBuilder(filter);

  const expectedChanges = {
    'index.html': 'create',
    'path/': 'mkdir',
    'path/to/': 'mkdir',
    'path/to/files/': 'mkdir',
    'path/to/files/index.html': 'create',
  };

  const expectedRead = {
    'index.html': indexHtml,
    path: {
      to: {
        files: {
          'index.html': indexHtml,
        }
      }
    }
  };

  await builder.build();

  assert.deepEqual(builder.changes(), expectedChanges);
  assert.deepEqual(builder.read(), expectedRead);

  await builder.dispose();
});

test('processString returns html with processors', async assert => {
  const processor = jsdom => {
    const document = jsdom.window.document;
    const head = document.querySelector('head');
    const insertBefore = head.querySelector('title');
    const meta = document.createElement('meta');

    meta.setAttribute('name', 'test-name');
    meta.setAttribute('content', 'test-content');

    head.insertBefore(meta, insertBefore);

    return jsdom;
  };

  const filter = createFilter(assert, { files: ['index.html'], processors: [processor] });
  const builder = createBuilder(filter);

  const expectedChanges = {
    'index.html': 'create',
    'path/': 'mkdir',
    'path/to/': 'mkdir',
    'path/to/files/': 'mkdir',
    'path/to/files/index.html': 'create',
  };

  const expectedRead = {
    'index.html': expectedIndexHtml,
    path: {
      to: {
        files: {
          'index.html': indexHtml,
        }
      }
    }
  };

  await builder.build();

  assert.deepEqual(builder.changes(), expectedChanges);
  assert.deepEqual(builder.read(), expectedRead);

  await builder.dispose();
});
