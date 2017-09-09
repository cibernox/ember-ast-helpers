'use strict';

import { builders as b } from '@glimmer/syntax';
import processTemplate from '../../helpers/process-template';
import { buildAttr, buildAttrContent } from '../../../lib/html';

describe('Helper #buildToAttrContent', function() {
  it('receives an array of mixed types and builds the content for an attribute efficiently', function() {
    let attrContent;
    let modifiedTemplate = processTemplate(`{{my-foo}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-foo') {
          attrContent = buildAttrContent([
            'rawstring',
            1,
            b.string('StringLiteral'),
            b.number('2'),
            b.undefined(),
            b.null(),
            b.path('Path'),
            b.text('TextNode'),
            b.sexpr(b.path('concat'), [b.path('firstName'), b.path('lastName')]),
          ]);
          let attr = buildAttr('class', attrContent);
          let attrs = attr ? [attr] : [];
          return b.element('div', attrs);
        }
      }
    });

    expect(attrContent).toHaveProperty('type', 'ConcatStatement');
    expect(modifiedTemplate).toEqual(`<div class="rawstring1StringLiteral2{{Path}}TextNode{{concat firstName lastName}}"></div>`);
  });

  it('mixes and joins consecurive string-like arguments', function() {
    let attrContent;
    let modifiedTemplate = processTemplate(`{{my-foo}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-foo') {
          attrContent = buildAttrContent([
            'rawstring',
            1,
            b.string('StringLiteral'),
            b.number('2'),
            b.undefined(),
            b.text('TextNode'),
            b.null(),
            'LastString'
          ]);

          let attr = buildAttr('class', attrContent);
          let attrs = attr ? [attr] : [];
          return b.element('div', attrs);
        }
      }
    });


    expect(attrContent).toHaveProperty('type', 'TextNode');
    expect(modifiedTemplate).toEqual(`<div class="rawstring1StringLiteral2TextNodeLastString"></div>`);
  });
});
