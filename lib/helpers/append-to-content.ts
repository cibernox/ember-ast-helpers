'use strict';
import { builders as b } from '@glimmer/syntax';

function appendLiteralToContent(str, content, opts) {
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

function appendTextNodeToContent(textNode, content, opts) {
  return appendLiteralToContent(textNode.chars, content, opts);
}

function appendMustacheToContent(mustache, content, opts) {
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

function appendPathToContent(pathExp, content, opts) {
  return appendMustacheToContent(b.mustache(pathExp), content, opts);
}

function appendSubExpressionToContent(sexpr, content, opts) {
  return appendMustacheToContent(b.mustache(sexpr.path, sexpr.params, sexpr.hash), content, opts);
}

export default function appendToContent(val, content, opts) {
  content = content || b.text('');
  opts = opts || { prependSpace: true };
  if (val !== undefined) {
    switch(val.type) {
    case 'PathExpression':
      content = appendPathToContent(val, content, opts);
      break;
    case 'SubExpression':
      content = appendSubExpressionToContent(val, content, opts);
      break;
    case 'MustacheStatement':
      content = appendMustacheToContent(val, content, opts);
      break;
    case 'TextNode':
      content = appendTextNodeToContent(val, content, opts);
      break;
    case undefined:
      if (typeof val === 'string') {
        content = appendLiteralToContent(val, content, opts);
      }
      break;
    default:
      content = appendLiteralToContent(val.value, content, opts);
    }
  }
  return content;
}
