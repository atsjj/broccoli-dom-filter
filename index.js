'use strict';

const { BroccoliDomFilterPatternError } = require('./errors');
const { JSDOM } = require('jsdom');
const { Minimatch } = require('minimatch');
const BroccoliPersistentFilter = require('broccoli-persistent-filter');

function processPattern(pattern) {
  if (pattern instanceof RegExp) {
    return pattern;
  }

  const type = typeof pattern;

  if (type === 'string') {
    return new Minimatch(pattern);
  }

  if (type === 'function') {
    return pattern;
  }

  throw new BroccoliDomFilterPatternError(type);
}

class BroccoliDomFilter extends BroccoliPersistentFilter {
  constructor(inputTree, options) {
    super(inputTree, options);

    const { annotation = '', files = [], processorOptions = {}, processors = [] } = options;

    this.annotation = annotation || '';
    this.files = (files || []).map(processPattern);
    this.processorOptions = processorOptions || {};
    this.processors = processors || [];
  }

  canProcessFile(relativePath) {
    const { length } = this.files.filter(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(relativePath);
      } else if (pattern instanceof Minimatch) {
        return pattern.match(relativePath);
      } else if (typeof pattern === 'function') {
        return pattern(relativePath);
      }

      return false;
    });

    return !!length;
  }

  getDestFilePath(relativePath) {
    return relativePath;
  }

  processDocument(string) {
    return this.processors
      .reduce((jsdom, processor) => processor(jsdom, this.processorOptions), new JSDOM(string))
      .serialize();
  }

  processString(string) {
    if (this.processors.length > 0) {
      return this.processDocument(string);
    }

    return string;
  }
}

module.exports = BroccoliDomFilter;
