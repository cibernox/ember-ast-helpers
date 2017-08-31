'use strict';

import { builders as b } from '@glimmer/syntax';
import processTemplate from '../helpers/process-template';
import { buildAttr } from '../../lib';

describe('Helper #appendToContent', function() {
  it('it builds attrs given a string', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr('not-class', 'new content');
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class="new content"></div>`);
  });

  it('it builds attrs given a TextNode', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr('not-class', b.text('new content'));
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class="new content"></div>`);
  });

  it('it builds attrs given a StringLiteral', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr('not-class', b.string('new content'));
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class="new content"></div>`);
  });

  it('it builds attrs given a BooleanLiteral', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr('not-class', b.boolean(true));
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class=""></div>`);

    modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr('not-class', b.boolean(false));
      }
    });

    expect(modifiedTemplate).toEqual(`<div></div>`);
  });

  it('it builds attrs given a NumberLiteral', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr('not-class', b.number(2));
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class="2"></div>`);

    modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr('not-class', b.boolean(false));
      }
    });

    expect(modifiedTemplate).toEqual(`<div></div>`);
  });

  it('it builds attrs given a PathExpression', function() {
    let modifiedTemplate = processTemplate(`<div class="foo"></div>`, {
      AttrNode() {
        return buildAttr('not-class', b.path('boundValue'));
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class={{boundValue}}></div>`);
  });

  it('it builds attrs given a SubExpression', function() {
    let modifiedTemplate = processTemplate(`{{some-helper title=(concat 'a' 'b')}}`, {
      MustacheStatement(node) {
        let title = node.hash.pairs.filter((p) => p.key === 'title')[0];
        if (title !== undefined) {
          let attrs = [];
          let attr = buildAttr('not-class', title.value);
          if (attr) {
            attrs.push(attr)
          }
          return b.element('div', attrs);
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class={{concat "a" "b"}}></div>`);
  });
});
