'use strict';

import processTemplate from '../helpers/process-template';
import BuildTimeComponent, { BuildTimeComponentNode, BuildTimeComponentOptions } from '../../lib/build-time-component';
import { builders as b, AST } from '@glimmer/syntax';

describe('BuildTimeComponent', function() {
  // tagName
  it('generates a div by default', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div></div>`);
  });

  it('honors the default tagName passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, { tagName: 'i' }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<i></i>`);
  });

  it('honors tagName received over any default', function() {
    let modifiedTemplate = processTemplate(`{{my-component tagName="span"}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, { tagName: 'i' }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<span></span>`);
  });

  it('honors tagName set when subclassing', function() {
    class MyComponent extends BuildTimeComponent {
      tagName = 'span'
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new MyComponent(node).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<span></span>`);
  });

  it('honors the default tagName over the one specified subclassing', function() {
    class MyComponent extends BuildTimeComponent {
      tagName = 'section'
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new MyComponent(node, { tagName: 'span' }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<span></span>`);
  });

  // class
  it('honors the default classNames passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, { classNames: ['foo', 'bar'] }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="foo bar"></div>`);
  });

  it('honors the default classNames defined on subclasses', function() {
    class MyComponent extends BuildTimeComponent {
      classNames = ['foo', 'bar']
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new MyComponent(node).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="foo bar"></div>`);
  });

  it('classNames are treated as concatenated properties, in the order they where declared', function() {
    class MyComponent extends BuildTimeComponent {
      classNames = ['foo', 'bar']
    }
    class MySubComponent extends MyComponent {
      classNames = ['foobar']
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new MySubComponent(node, { classNames: ['qux'] }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="foo bar foobar qux"></div>`);
  });

  it('concatenates the default classes and the additional strings passed with the `class` option', function() {
    let modifiedTemplate = processTemplate(`{{my-component class="extra-class"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNames: ['foo', 'bar'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="foo bar extra-class"></div>`);
  });

  it('concatenates the default classes and the additional boundValue passed with the `class` option', function() {
    let modifiedTemplate = processTemplate(`{{my-component class=extraClass}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNames: ['foo', 'bar'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="foo bar {{extraClass}}"></div>`);
  });

  it('concatenates the default classes and the additional subexpression passed with the `class` option', function() {
    let modifiedTemplate = processTemplate(`{{my-component class=(concat 'a' 'b')}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNames: ['foo', 'bar'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="foo bar {{concat "a" "b"}}"></div>`);
  });

  // classNameBindings
  it('transform boolean literals to class names', function() {
    let modifiedTemplate = processTemplate(`{{my-component isActive=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="is-active"></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive'] }).toElement();
        }
      }
    });
    expect(modifiedTemplate).toEqual(`<div></div>`);
  });

  it('transform paths to class names', function() {
    let modifiedTemplate = processTemplate(`{{my-component isActive=isActive}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class={{isActive}}></div>`);
  });

  it('transform paths to class names using the truthy class', function() {
    let modifiedTemplate = processTemplate(`{{my-component isActive=isActive}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive:is-active'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class={{if isActive "is-active"}}></div>`);
  });

  it('accepts colon syntax to bind attributes to custom classes', function() {
    let modifiedTemplate = processTemplate(`{{my-component isActive=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="on-duty"></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=isActive}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class={{if isActive "on-duty"}}></div>`);
  });

  it('accepts colon syntax to bind attributes to custom classes and its opposite', function() {
    let modifiedTemplate = processTemplate(`{{my-component isActive=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty:reservist'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="on-duty"></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty:reservist'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="reservist"></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=isActive}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty:reservist'] }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class={{if isActive "on-duty" "reservist"}}></div>`);
  });

  it('binds properties passed on initialization to the class', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, {
            classNameBindings: ['isActive:on-duty:reservist'],
            isActive: true
          }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="on-duty"></div>`);

    modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, {
            classNameBindings: ['isActive:on-duty:reservist'],
            isActive: false
          }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="reservist"></div>`);
  });

  it('the property passed in the template wins over the one overrides passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component extraClass="runtime"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, {
            classNameBindings: ['extraClass'],
            extraClass: 'override'
          }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="runtime"></div>`);
  });

  it('the property passed in the template wins over the one specified when subclassing', function() {
    class MyComponent extends BuildTimeComponent {
      extraClass = 'extend-time'
      classNameBindings = ['extraClass']
    }

    let modifiedTemplate = processTemplate(`{{my-component extraClass="runtime"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="runtime"></div>`);
  });

  it('the property passed on creation wins over the one defined in extension', function() {
    class SubComponent extends BuildTimeComponent {
      get isActive() {
        return false;
      }
    }

    let modifiedTemplate = processTemplate(`{{my-component isActive=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new SubComponent(node, {
            classNameBindings: ['isActive:on-duty:reservist'],
            isActive: true
          }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="on-duty"></div>`);
  });

  it('the `<propName>` attribute is used if no runtime or create time option wins over it', function() {
    class SubComponent extends BuildTimeComponent {
      isActive = true
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new SubComponent(node, {
            classNameBindings: ['isActive:on-duty:reservist'],
          }).toElement();;
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="on-duty"></div>`);

    class AnotherSubComponent extends BuildTimeComponent {
      get isActive() {
        return 'yes';
      }
    }

    modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new AnotherSubComponent(node, {
            classNameBindings: ['isActive'],
          }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="yes"></div>`);
  });

  it('the `<propName>Content` function trumps over runtime arguments, initialization options or getters', function() {
    class SubComponent extends BuildTimeComponent {
      isActive = false
    }
    class SubSubComponent extends BuildTimeComponent {
      isActive = false
      isActiveContent() {
        return true; // this will trump over everything
      }
    }

    let modifiedTemplate = processTemplate(`{{my-component isActive=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new SubSubComponent(node, {
            classNameBindings: ['isActive:on-duty:reservist'],
            isActive: false
          }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="on-duty"></div>`);
  });

  // attributeBindings
  it('binds properties passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, {
          title: 'sample title',
          attributeBindings: ['title']
        }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="sample title"></div>`);
  });

  it('binds properties set on subclasses', function() {
    class MyComponent extends BuildTimeComponent {
      title = 'sample title'
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new MyComponent(node, { attributeBindings: ['title'] }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="sample title"></div>`);
  });

  it('works when attribute bindings are defined in extension time', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['title']
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new MyComponent(node, { title: 'sample title' }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="sample title"></div>`);
  });

  it('attribute bindings are treated as concatenated properties', function() {
    class MyComponent extends BuildTimeComponent {
      attributeBindings = ['title']
    }
    class MySubComponent extends MyComponent {
      attributeBindings = ['ariaLabel:aria-label']
    }

    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new MySubComponent(node, {
          title: 'sample title',
          ariaLabel: 'sample label',
          foo: 'bar',
          attributeBindings: ['foo']
        }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="sample title" aria-label="sample label" foo="bar"></div>`);
  });

  it('binds properties passed to the constructor to the right attribute', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, {
          title: 'sample title',
          attributeBindings: ['title:aria-label']
        }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-label="sample title"></div>`);
  });

  it('binds properties passed to the constructor using the truthy and falsy class', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, {
          title: 'sample title',
          attributeBindings: ['title:title:has-title:no-title']
        }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="has-title"></div>`);

    modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, {
          title: false,
          attributeBindings: ['title:title:has-title:no-title']
        }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="no-title"></div>`);
  });

  it('binds properties passed on invocation over those passed in the controller', function() {
    let modifiedTemplate = processTemplate(`{{my-component title="real title"}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, {
          title: 'default title',
          attributeBindings: ['title']
        }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="real title"></div>`);
  });

  it('binds properties passed on invocation over those passed in the controller, to the specified attribute', function() {
    let modifiedTemplate = processTemplate(`{{my-component title="real title"}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, {
          title: 'default title',
          attributeBindings: ['title:aria-label']
        }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-label="real title"></div>`);
  });

  it('binds properties passed on invocation over those passed in the controller using the truthy class', function() {
    let modifiedTemplate = processTemplate(`{{my-component isDisabled=true}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, {
          isDisabled: false,
          attributeBindings: ['isDisabled:disabled:nope']
        }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div disabled="nope"></div>`);
  });

  it('the `<propName>Content` function trumps over runtime arguments, initialization options or getters', function() {
    class SubComponent extends BuildTimeComponent {
      isActive = 'nope'
    }
    class SubSubComponent extends BuildTimeComponent {
      isActive = 'nein'
      isActiveContent() {
        return 'yes'; // this will trump over everything
      }
    }

    let modifiedTemplate = processTemplate(`{{my-component isActive=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new SubSubComponent(node, {
            attributeBindings: ['isActive:is-active'],
            isActive: 'non'
          }).toElement()
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div is-active="yes"></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new SubSubComponent(node, {
            attributeBindings: ['isActive:is-active:si'],
            isActive: 'non'
          }).toElement()
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div is-active="si"></div>`);
  });

  // block transform
  it('copies the block over to the element', function() {
    let modifiedTemplate = processTemplate(`{{#my-component title=boundValue}}<span>Inner content</span>{{/my-component}}`, {
      BlockStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>Inner content</span></div>`);
  });

  it('transforms the block with the given visitor if provided', function() {
    let modifiedTemplate = processTemplate(`{{#my-component}}<span>Inner content</span>{{/my-component}}<span>outside span</span>`, {
      BlockStatement(node) {
        if (node.path.original === 'my-component') {
          return new BuildTimeComponent(node, {
            contentVisitor: {
              ElementNode(node: AST.ElementNode) {
                return b.element('strong', [], [], node.children);
              }
            }
          }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><strong>Inner content</strong></div><span>outside span</span>`);
  });

  it('the visitor can be specified in class extension', function() {
    class MyComponent extends BuildTimeComponent {
      contentVisitor = {
        ElementNode(node: AST.ElementNode) {
          return b.element('strong', [], [], node.children);
        }
      }
    }

    let modifiedTemplate = processTemplate(`{{#my-component}}<span>Inner content</span>{{/my-component}}<span>outside span</span>`, {
      BlockStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><strong>Inner content</strong></div><span>outside span</span>`);
  });

  it('the visitor does nothing if the element has no block', function() {
    class MyComponent extends BuildTimeComponent {
      contentVisitor = {
        ElementNode(node: AST.ElementNode) {
          return b.element('strong', [], [], node.children);
        }
      }
    }

    let modifiedTemplate = processTemplate(`{{my-component}}<span>outside span</span>`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div></div><span>outside span</span>`);
  });

  it('the visitor can be specified in class extension and have access to the component when used with arrow functions', function() {
    class MyComponent extends BuildTimeComponent {
      contentVisitor = {
        ElementNode: (node: AST.ElementNode) => {
          let pair = this.node.hash.pairs.find((p) => p.key === 'classForChildren');
          let attrs: AST.AttrNode[] = [];
          if (pair && pair.value.type === 'StringLiteral') {
            attrs.push(b.attr('class', b.text(pair.value.value)));
          }
          return b.element('strong', attrs, [], node.children);
        }
      }
    }

    let modifiedTemplate = processTemplate(`{{#my-component classForChildren="foobar"}}<span>Inner content</span>{{/my-component}}<span>outside span</span>`, {
      BlockStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><strong class="foobar">Inner content</strong></div><span>outside span</span>`);
  });
});
