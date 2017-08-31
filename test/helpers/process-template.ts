'use strict';

import {
  traverse,
  preprocess,
  print,
  NodeVisitor,
  ASTPluginBuilder,
  ASTPlugin
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
  let newAst = preprocess(template, {
    plugins: {
      ast: [plugin(buildPlugin(visitor))]
    }
  });
  return print(newAst);
}
