'use strict';

const expect = require('chai').expect;
const processTemplate = require('../helpers/process-template');
const { builders: b } = require('@glimmer/syntax');
const buildAttr = require('../../lib/helpers/build-attr');

describe('Helper #appendToContent', function() {
  describe('it builds attrs given a string', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr(b, 'not-class', 'new content');
      }
    });

    expect(modifiedTemplate).to.equal(`<div not-class="new content"></div>`);
  });

  describe('it builds attrs given a TextNode', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr(b, 'not-class', b.text('new content'));
      }
    });

    expect(modifiedTemplate).to.equal(`<div not-class="new content"></div>`);
  });

  describe('it builds attrs given a StringLiteral', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr(b, 'not-class', b.string('new content'));
      }
    });

    expect(modifiedTemplate).to.equal(`<div not-class="new content"></div>`);
  });

  describe('it builds attrs given a PathExpression', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr(b, 'not-class', b.path('boundValue'));
      }
    });

    expect(modifiedTemplate).to.equal(`<div not-class={{boundValue}}></div>`);
  });
});
