'use strict';

import { builders as b, AST } from '@glimmer/syntax';

export type AttrValue = AST.TextNode | AST.MustacheStatement | AST.ConcatStatement;
export type CoherzableToAttrValue = AttrValue | AST.PathExpression | AST.SubExpression | AST.Literal | string | undefined;

export default function buildAttr(name: string, content: CoherzableToAttrValue): AST.AttrNode | null {
  if (content === undefined) {
    return null;
  } else if (typeof content === 'string') {
    return b.attr(name, b.text(content));
  } else if (content.type === 'PathExpression') {
    return b.attr(name, b.mustache(content));
  } else if (content.type === 'SubExpression') {
    return b.attr(name, b.mustache(content.path, content.params));
  } else if (content.type === 'StringLiteral') {
    return b.attr(name, b.text(content.value));
  } else if (content.type === 'BooleanLiteral') {
    return content.value ? b.attr(name, b.text('')) : null;
  } else if (content.type === 'NumberLiteral') {
    return b.attr(name, b.text(String(content.value)));
  } else if (content.type === 'NullLiteral' || content.type === 'UndefinedLiteral') {
    return null;
  } else {
    return b.attr(name, content);
  }
}
