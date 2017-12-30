"use strict";

import { AST } from '@glimmer/syntax';
export type BuildAttrContent = AST.AttrNode['value'] | AST.Expression | string | undefined;
export type AppendableToAttrContent = BuildAttrContent | number | null;
export interface Builders {
  text(chars?: string, loc?: AST.SourceLocation): AST.TextNode
  attr(name: string, value: AST.AttrNode['value'], loc?: AST.SourceLocation): AST.AttrNode
  mustache(path: string | AST.PathExpression | AST.Literal, params?: AST.Expression[], hash?: AST.Hash, raw?: boolean, loc?: AST.SourceLocation): AST.MustacheStatement
  concat(parts: (AST.TextNode | AST.MustacheStatement)[], loc?: AST.SourceLocation): AST.ConcatStatement
}
// BuildAttr
export function buildAttr(b: Builders, name: string, content: BuildAttrContent): AST.AttrNode | null {
  if (content === undefined) {
    return null;
  } else if (typeof content === 'string') {
    return b.attr(name, b.text(content));
  } else if (content.type === 'PathExpression') {
    return b.attr(name, b.mustache(content));
  } else if (content.type === 'SubExpression') {
    return b.attr(name, b.mustache(content.path, content.params, content.hash));
  } else if (content.type === 'StringLiteral') {
    return b.attr(name, b.text(content.value));
  } else if (content.type === 'BooleanLiteral') {
    return content.value ? b.attr(name, b.text('')) : null;
  } else if (content.type === 'NumberLiteral') {
    return b.attr(name, b.text(String(content.value)));
  } else if (content.type === 'NullLiteral' || content.type === 'UndefinedLiteral') {
    return null;
  } else if (content.type === 'ConcatStatement') {
    if (content.parts.length === 1) {
      content.parts[0]
      return buildAttr(b, name, content.parts[0]);
    }
    return b.attr(name, content);
  } else {
    return b.attr(name, content);
  }
}

// appendToAttrContent
export function appendToAttrContent(b: Builders, val: AppendableToAttrContent, content?: AST.AttrNode['value'], opts = { prependSpace: true }): AST.AttrNode['value'] {
  if (content === undefined || content === null) {
    content = b.text('')
  } else if (typeof content === 'string') {
    content = b.text(content);
  }
  if (val === undefined || val === null) {
    return content;
  }
  if (typeof val === 'string' || typeof val === 'number') {
    return appendLiteralToContent(b, String(val), content, opts);
  }
  switch(val.type) {
  case 'StringLiteral':
    content = appendLiteralToContent(b, val.value, content, opts);
    break;
  case 'NumberLiteral':
    content = appendLiteralToContent(b, String(val.value), content, opts);
    break;
  case 'PathExpression':
    content = appendPathToContent(b, val, content, opts);
    break;
  case 'SubExpression':
    content = appendSubExpressionToContent(b, val, content, opts);
    break;
  case 'MustacheStatement':
    content = appendMustacheToContent(b, val, content, opts);
    break;
  case 'ConcatStatement':
    val.parts.forEach((part, i) => {
      content = appendToAttrContent(b, part, content, i === 0 ? opts : { prependSpace: false });
    });
    break;
  case 'TextNode':
    content = appendTextNodeToContent(b, val, content, opts);
    break;
  }
  return content;
}


interface AppendOptions {
  prependSpace: boolean
}

function appendLiteralToContent(b: Builders, str: string, content: AST.AttrNode['value'], opts: AppendOptions): AST.AttrNode['value'] {
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

function appendTextNodeToContent(b: Builders, textNode: AST.TextNode, content: AST.AttrNode['value'], opts: AppendOptions): AST.AttrNode['value'] {
  return appendLiteralToContent(b, textNode.chars, content, opts);
}

function appendMustacheToContent(b: Builders, mustache: AST.MustacheStatement, content: AST.AttrNode['value'], opts: AppendOptions): AST.AttrNode['value'] {
  if (mustache.path.type === 'StringLiteral') {
    if (content.type === 'TextNode') {
      if (content.chars !== '') {
        if (opts.prependSpace) {
          content.chars += ' ';
        }
        content.chars += mustache.path.value;
      } else {
        content.chars = mustache.path.value;
      }
    } else if (content.type === 'ConcatStatement') {
      let lastPart = content.parts[content.parts.length - 1];
      if (opts.prependSpace) {
        if (lastPart.type === 'TextNode') {
          lastPart.chars = `${lastPart.chars} ${mustache.path.value}`;
        } else {
          content.parts.push(b.text(` ${mustache.path.value}`));
        }
      }
    }
    return content;
  }
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

function appendPathToContent(b: Builders, pathExp: AST.PathExpression, content: AST.AttrNode['value'], opts: AppendOptions): AST.AttrNode['value'] {
  return appendMustacheToContent(b, b.mustache(pathExp), content, opts);
}

function appendSubExpressionToContent(b: Builders, sexpr: AST.SubExpression, content: AST.AttrNode['value'], opts: AppendOptions): AST.AttrNode['value'] {
  return appendMustacheToContent(b, b.mustache(sexpr.path, sexpr.params, sexpr.hash), content, opts);
}

// buildAttrContent
export function buildAttrContent(b: Builders, parts: AppendableToAttrContent[]): BuildAttrContent {
  let content: BuildAttrContent = undefined;
  for(let i = 0; i < parts.length; i++) {
    content = appendToAttrContent(b, parts[i], content, { prependSpace: false });
  }
  return content;
}
