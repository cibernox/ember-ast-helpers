/* eslint-env node */
'use strict';

function buildAttr(b, name, content) {
  if (content.type === 'PathExpression') {
    return b.attr(name, b.mustache(content));
  } else if (content.type === 'StringLiteral') {
    return b.attr(name, b.text(content.value));
  } else if (typeof content === 'string') {
    return b.attr(name, b.text(content));
  } else {
    return b.attr(name, content);
  }
}

module.exports = buildAttr;
