/* eslint-env node */
'use strict';

function appendToContent(b, val, content, opts) {
  content = content || b.text('');
  opts = opts || { prependSpace: true };
  if (val !== undefined) {
    switch(val.type) {
    case 'PathExpression':
      content = appendPathToContent(b, val, content, opts);
      break;
    case 'SubExpression':
      content = appendSubExpressionToContent(b, val, content, opts);
      break;
    case 'MustacheStatement':
      content = appendMustacheToContent(b, val, content, opts);
      break;
    case 'TextNode':
      content = appendTextNodeToContent(b, val, content, opts);
      break;
    case undefined:
      if (typeof val === 'string') {
        content = appendLiteralToContent(b, val, content, opts);
      }
      break;
    default:
      content = appendLiteralToContent(b, val.value, content, opts);
    }
  }
  return content;
}

function appendLiteralToContent(b, str, content, opts) {
  if (content.type === 'TextNode') {
    if (content.chars === '') {
      content.chars = str;
    } else {
      content.chars = [content.chars, str].join(opts.prependSpace ? ' ' : '');
    }
  } else if (content.type === 'ConcatStatement') {
    let lastPart = content.parts[content.parts.length - 1];
    if (lastPart.type === 'TextNode') {
      lastPart.chars = [lastPart.chars, str].join(opts.prependSpace ? ' ' : '');
    } else {
      content.parts.push(b.text(opts.prependSpace ? ` ${str}` : str));
    }
  } else {
    throw new Error('Unexpected content type');
  }
  return content;
}

function appendTextNodeToContent(b, textNode, content, opts) {
  return appendLiteralToContent(b, textNode.chars, content, opts);
}

function appendMustacheToContent(b, mustache, content, opts) {
  if (content.type === 'TextNode') {
    if (content.chars !== '') {
      if (opts.prependSpace) {
        content.chars += ' ';
      }
      return b.concat([content, mustache]);
    } else {
      return b.concat([mustache]);
    }
  } else if (content.type === 'ConcatStatement') {
    let lastPart = content.parts[content.parts.length - 1];
    if (opts.prependSpace) {
      if (lastPart.type === 'TextNode') {
        lastPart.chars = `${lastPart.chars} `;
      } else {
        content.parts.push(b.text(' '));
      }
    }
    content.parts.push(mustache);
    return content;
  } else {
    throw new Error('Unexpected content type');
  }
}

function appendPathToContent(b, pathExp, content, opts) {
  return appendMustacheToContent(b, b.mustache(pathExp), content, opts);
}

function appendSubExpressionToContent(b, sexpr, content, opts) {
  return appendMustacheToContent(b, b.mustache(sexpr.path, sexpr.params, sexpr.hash), content, opts);
}

module.exports = appendToContent;
