/* eslint-env node */
'use strict';

function appendToContent(b, val, content = b.text('')) {
  if (val !== undefined) {
    switch(val.type) {
    case 'PathExpression':
      content = appendPathToContent(b, val, content);
      break;
    case 'SubExpression':
      content = appendSubExpressionToContent(b, val, content);
      break;
    case 'MustacheStatement':
      content = appendMustacheToContent(b, val, content);
      break;
    case 'TextNode':
      content = appendTextNodeToContent(b, val, content);
      break;
    case undefined:
      if (typeof val === 'string') {
        content = appendLiteralToContent(b, val, content);
      }
      break;
    default:
      content = appendLiteralToContent(b, val.value, content);
    }
  }
  return content;
}

function appendLiteralToContent(b, str, content) {
  if (content.type === 'TextNode') {
    content.chars = content.chars === '' ? str : `${content.chars} ${str}`;
  } else if (content.type === 'ConcatStatement') {
    let lastPart = content.parts[content.parts.length - 1];
    if (lastPart.type === 'TextNode') {
      lastPart.chars = `${lastPart.chars} ${str}`;
    } else {
      content.parts.push(b.text(` ${str}`));
    }
  } else {
    throw new Error('Unexpected content type');
  }
  return content;
}

function appendTextNodeToContent(b, textNode, content) {
  return appendLiteralToContent(b, textNode.chars, content);
}

function appendMustacheToContent(b, mustache, content) {
  if (content.type === 'TextNode') {
    content.chars += ' ';
    return b.concat([content, mustache]);
  } else if (content.type === 'ConcatStatement') {
    let lastPart = content.parts[content.parts.length - 1];
    if (lastPart.type === 'TextNode') {
      lastPart.chars = `${lastPart.chars} `;
    } else {
      content.parts.push(b.text(' '));
    }
    content.parts.push(mustache);
    return content;
  } else {
    throw new Error('Unexpected content type');
  }
}

function appendPathToContent(b, pathExp, content) {
  return appendMustacheToContent(b, b.mustache(pathExp), content);
}

function appendSubExpressionToContent(b, subexpression, content) {
  if (content.type === 'TextNode') {
    return b.concat([content, b.mustache(subexpression)]);
  } else if (content.type === 'ConcatStatement') {
    let lastPart = content.parts[content.parts.length - 1];
    if (lastPart.type === 'TextNode') {
      lastPart.chars = `${lastPart.chars} `;
    } else {
      content.parts.push(b.text(' '));
    }
    content.parts.push(b.mustache(subexpression.path, subexpression.params));
    return content;
  } else {
    throw new Error('Unexpected content type');
  }
}

module.exports = appendToContent;
