'use strict';

const expect = require('chai').expect;
const glimmerPrecompile = require('@glimmer/compiler').precompile;

function precompileTemplate(template, astPlugin) {
  return glimmerPrecompile(template, {
    rawSource: template,
    moduleName: 'layout.hbs',
    plugins: {
      ast: astPlugin
    }
  });
}


function buildPlugin(visitor) {
  let Plugin = class {
    constructor() {
      this.syntax = null;
    }

    transform(ast) {
      //let b = this.syntax.builders;

      this.syntax.traverse(ast, visitor);
    }

    visitor() {
      return visitor;
    }
  };

  return Plugin;
}

function plugin(Plugin, name, config) {
  let plugin = new Plugin({ name, config});

  return env => {
    plugin.templateEnvironmentData = env;
    let visitor = plugin.visitor();

    return { name, visitor };
  };
}


let visitor = {
  MustacheStatement(node) {
    return node;
  }
};

function precompile(template) {
  return precompileTemplate(template, [ plugin(buildPlugin(visitor), 'fake', {}) ]);
}

describe('Helper #appendToContent', function() {
  describe('it works', function() {
    let modifiedTemplate = precompile(`{{someContent}}`);
    debugger;
    expect(1).to.equal(2);
  });
});
