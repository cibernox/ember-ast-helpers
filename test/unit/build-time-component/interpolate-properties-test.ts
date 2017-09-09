'use strict';

import { builders as b, AST } from '@glimmer/syntax';
import processTemplate from '../../helpers/process-template';
import BuildTimeComponent, { interpolateProperties } from '../../../lib/build-time-component';

describe('Helper #interpolateProperties', function() {
  it('interpolates literals passed on the template', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties('Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component firstName="Robert" lastName="Jackson"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is Robert Jackson"></div>');
  });

  it('interpolates paths passed on the template', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties('Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component firstName="Robert" lastName=lastName}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is Robert {{lastName}}"></div>');
  });

  it('interpolates subexpressions passed on the template', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['salute:aria-label']
      saluteContent = interpolateProperties('Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component firstName=firstName lastName=(if anonymous 'Doe' 'Jackson')}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
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
      saluteContent = interpolateProperties('Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
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
      saluteContent = interpolateProperties('Hello, my name is :firstName: :lastName:');
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node, { firstName: 'Jane', lastName: 'Doe' }).toElement();
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
      saluteContent = interpolateProperties('Hello, my name is :firstName: :lastName:')
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
          return new MyComponent(node, { firstName: 'John', lastName: 'Smith' }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual('<div aria-label="Hello, my name is Jane Doe"></div>');
  });
});
