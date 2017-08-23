'use strict';

const expect = require('chai').expect;
const processTemplate = require('../helpers/process-template');
const syntax = require('@glimmer/syntax');
const b = syntax.builders;

describe('Helper #appendToContent', function() {
  describe('it works', function() {
    let modifiedTemplate = processTemplate(`{{one}}{{two}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'one') {
          return b.mustache(b.path('newContent'));
        }
        return node;
      }
    });
    expect(modifiedTemplate).to.equal(`{{newContent}}{{two}}`); // how to convert the glimmer AST back to hbs syntax? ASTexplorer.net does it.g
  });
});
