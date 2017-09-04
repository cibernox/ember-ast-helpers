'use strict';
import { builders as b, AST } from '@glimmer/syntax';
import { AttrValue } from './build-attr';

interface AppendOptions {
  prependSpace: boolean
}

export type AttrValueAppendable = AST.PathExpression | AST.SubExpression | AST.TextNode | AST.Literal | AST.Literal | AST.MustacheStatement | AST.ConcatStatement | string | number;

function appendLiteralToContent(str: string, content: AttrValue, opts: AppendOptions): AttrValue {
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

function appendTextNodeToContent(textNode: AST.TextNode, content: AttrValue, opts: AppendOptions): AttrValue {
  return appendLiteralToContent(textNode.chars, content, opts);
}

function appendMustacheToContent(mustache: AST.MustacheStatement, content: AttrValue, opts: AppendOptions): AttrValue {
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

function appendPathToContent(pathExp: AST.PathExpression, content: AttrValue, opts: AppendOptions): AttrValue {
  return appendMustacheToContent(b.mustache(pathExp), content, opts);
}

function appendSubExpressionToContent(sexpr: AST.SubExpression, content: AttrValue, opts: AppendOptions): AttrValue {
  return appendMustacheToContent(b.mustache(sexpr.path, sexpr.params, sexpr.hash), content, opts);
}

export default function appendToContent(val: AttrValueAppendable, content: AttrValue = b.text(''), opts = { prependSpace: true }): AttrValue {
  if (typeof val === 'string' || typeof val === 'number') {
    return appendLiteralToContent(String(val), content, opts);
  }
  switch(val.type) {
  case 'StringLiteral':
    content = appendLiteralToContent(val.value, content, opts);
    break;
  case 'NumberLiteral':
    content = appendLiteralToContent(String(val.value), content, opts);
    break;
  case 'PathExpression':
    content = appendPathToContent(val, content, opts);
    break;
  case 'SubExpression':
    content = appendSubExpressionToContent(val, content, opts);
    break;
  case 'MustacheStatement':
    content = appendMustacheToContent(val, content, opts);
    break;
  case 'ConcatStatement':
    val.parts.forEach((part, i) => {
      content = appendToContent(part, content, i === 0 ? opts : { prependSpace: false });
    });
    break;
  case 'TextNode':
    content = appendTextNodeToContent(val, content, opts);
    break;
  }
  return content;
}
