'use strict';

const processTemplate = require('../helpers/process-template');
const b = require('@glimmer/syntax').builders;
const buildAttr = require('../../lib/helpers/build-attr');

describe('Helper #appendToContent', function() {
  it('it builds attrs given a string', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr(b, 'not-class', 'new content');
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class="new content"></div>`);
  });

  it('it builds attrs given a TextNode', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr(b, 'not-class', b.text('new content'));
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class="new content"></div>`);
  });

  it('it builds attrs given a StringLiteral', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr(b, 'not-class', b.string('new content'));
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class="new content"></div>`);
  });

  it('it builds attrs given a PathExpression', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr(b, 'not-class', b.path('boundValue'));
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class={{boundValue}}></div>`);
  });

  it('it builds attrs given a SubExpression', function() {
    let modifiedTemplate = processTemplate(`{{some-helper title=(concat 'a' 'b')}}`, {
      MustacheStatement(node) {
        let title = node.hash.pairs.find((p) => p.key === 'title');
        if (title !== undefined) {
          return b.element('div', [buildAttr(b, 'not-class', title.value)]);
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class={{concat "a" "b"}}></div>`);
  });
});
