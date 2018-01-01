'use strict';

import processTemplate, { syntax } from '../../helpers/process-template';
import BuildTimeComponent, { interpolateProperties } from '../../../lib/build-time-component';

describe('Helper #interpolateProperties', function() {
  it('interpolates literals passed on the template', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component firstName="Robert" lastName="Jackson"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is Robert Jackson"></div>');
  });

  it('interpolates paths passed on the template', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component firstName="Robert" lastName=lastName}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is Robert {{lastName}}"></div>');
  });

  it('interpolates subexpressions passed on the template', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component firstName=firstName lastName=(if anonymous 'Doe' 'Jackson')}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is {{firstName}} {{if anonymous "Doe" "Jackson"}}"></div>');
  });

  it('interpolates primitive values set on the component itself', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      firstName = 'Robert'
      lastName = 'Jackson'
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is Robert Jackson"></div>');
  });

  it('interpolates primitive values passed when the component was instantiated (other those set on the component itself)', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      firstName = 'Robert'
      lastName = 'Jackson'
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node, { firstName: 'Jane', lastName: 'Doe' }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is Jane Doe"></div>');
  });

  it('interpolates the value returned from `<propName>Content` instead of those passed on the template or initialization', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      firstName = 'Robert'
      lastName = 'Jackson'
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:')
      firstNameContent() {
        return 'Jane';
      }
      lastNameContent() {
        return 'Doe';
      }
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node, { firstName: 'John', lastName: 'Smith' }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is Jane Doe"></div>');
  });

  it('does uses interpolate the `<propName>Content` function if this very function IS the `<propName>Content`', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties(syntax.builders, 'i :salute: you')
    }

    let modifiedTemplate = processTemplate(`{{my-component salute="greet"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node, { firstName: 'John', lastName: 'Smith' }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="i greet you"></div>');
  });

  it('if we can determine that all interpolation values are null/false/undefined, it returns nothing', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div></div>');

    modifiedTemplate = processTemplate(`{{my-component firstName=null lastName=undefined}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node, { firstName: 'Robert', lastName: 'Jackson' }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div></div>');
  });

  it('if the interpolated properties are paths and we pass the `skipIfMissingDynamic: true` options, the entire binding is conditional (only works with 1 interpolation)', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName:', { skipIfMissingDynamic: true });
    }

    let modifiedTemplate = processTemplate(`{{my-component firstName=firstName}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label={{if firstName (concat "Hello, my name is " firstName)}}></div>');

    modifiedTemplate = processTemplate(`{{my-component firstName=(helper foo bar)}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label={{if (helper foo bar) (concat "Hello, my name is " (helper foo bar))}}></div>');
  });

  it('if we can determine that at least one interpolation value is null/undefined, it returns nothing', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      firstName = 'Robert'
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div></div>');
  });

  it('if there is default values but the user explicitly nullifies then on the `<propName>Content`, it returns nothing', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      firstName = 'Robert'
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:');
      firstNameContent() {
        return undefined;
      }
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div></div>');
  });

  it('if there is default values but the user explicitly nullifies then on the `<propName>Content`, it returns nothing', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      firstName = 'Robert'
      lastName = 'Jackson'
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component firstName=null}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div></div>');

    modifiedTemplate = processTemplate(`{{my-component firstName=undefined}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div></div>');


    modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node, { firstName: null }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div></div>');
  });

  it('if we can determine that all interpolation values are null/false/undefined but the user passes `skipIfMissing: false`, a string with missing parts is generated', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:', { skipIfMissing: false });
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is  "></div>');
  });

  it('if the user passes a callback on the options, it will be invoked with an object containing the interpolations', function() {
    let run = false;
    function callback(this: BuildTimeComponent, interpolations: { [key: string]: any }) {
      expect(this.options).toEqual({ foo: 'bar' });
      expect(interpolations.firstName.value).toEqual('Robert');
      expect(interpolations.lastName.type).toEqual('PathExpression');
      expect(interpolations.lastName.original).toEqual('lastName');
      run = true;
    }
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties(syntax.builders, 'Hello, my name is :firstName: :lastName:', { callback });
    }

    let modifiedTemplate = processTemplate(`{{my-component firstName="Robert" lastName=lastName}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(syntax, node, { foo: 'bar' }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is Robert {{lastName}}"></div>');
    expect(run).toBe(true)
  });
});
