const glimmerPrecompile = require('@glimmer/compiler').precompile;

function buildPlugin(visitor) {
  class Plugin {
    constructor() {
      this.syntax = null;
    }

    transform(ast) {
      this.syntax.traverse(ast, visitor);
    }

    visitor() {
      return visitor;
    }
  }

  return Plugin;
}

function plugin(Plugin) {
  let name = 'test-ast-transform';
  let plugin = new Plugin({ name, config: {}});

  return env => {
    plugin.templateEnvironmentData = env;
    let visitor = plugin.visitor();

    return { name, visitor };
  };
}

function processTemplate(template, visitor) {
  return glimmerPrecompile(template, {
    rawSource: template,
    moduleName: 'layout.hbs',
    plugins: {
      ast: [ plugin(buildPlugin(visitor)) ]
    }
  });
}

module.exports = processTemplate;
