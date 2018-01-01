'use strict';

import {
  builders,
  traverse,
  preprocess as parse,
  print,
  NodeVisitor,
  ASTPluginBuilder,
  ASTPlugin,
  Walker,
  AST,
  PreprocessOptions
} from '@glimmer/syntax';


function buildPlugin(visitor: NodeVisitor): ASTPlugin {
  return {
    name: 'test-ast-transform',
    visitor
  }
}

function plugin(plugin: ASTPlugin): ASTPluginBuilder {
  return env => plugin
}

export default function processTemplate(template: string, visitor: NodeVisitor) {
  let newAst = parse(template, {
    plugins: {
      ast: [plugin(buildPlugin(visitor))]
    }
  });
  return print(newAst);
}
export const syntax = { builders, parse, print, traverse, Walker };;
