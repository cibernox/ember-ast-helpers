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
        let title = node.hash.pairs.find((p) => p.key === 'title');
        if (title !== undefined) {
          return b.element('div', [buildAttr('not-class', title.value)]);
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div not-class={{concat "a" "b"}}></div>`);
  });
});
