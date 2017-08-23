'use strict';

const expect = require('chai').expect;
const processTemplate = require('../helpers/process-template');
const { builders: b } = require('@glimmer/syntax');
const appendToContent = require('../../lib/helpers/append-to-content');

describe('Helper #appendToContent', function() {
  describe('it can append regular strings to TextNode', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode(attr) {
        attr.value = appendToContent(b, 'bar', attr.value);
        attr.value = appendToContent(b, 'baz', attr.value);
        return attr;
      }
    });

    expect(modifiedTemplate).to.equal(`<div class="foo bar baz"></div>`);
  });

  describe('it can append TextNodes to another TextNode', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode(attr) {
        attr.value = appendToContent(b, b.text('bar'), attr.value);
        attr.value = appendToContent(b, b.text('baz'), attr.value);
        return attr;
      }
    });

    expect(modifiedTemplate).to.equal(`<div class="foo bar baz"></div>`);
  });

  describe('it can append PathExpression to TextNode', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode(attr) {
        attr.value = appendToContent(b, b.path('bar'), attr.value);
        attr.value = appendToContent(b, b.path('baz'), attr.value);
        return attr;
      }
    });

    expect(modifiedTemplate).to.equal(`<div class="foo {{bar}} {{baz}}"></div>`);
  });
});
