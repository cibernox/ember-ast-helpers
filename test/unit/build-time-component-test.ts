'use strict';

import processTemplate from '../helpers/process-template';
import BuildTimeComponent, { BuildTimeComponentNode, BuildTimeComponentOptions } from '../../lib/build-time-component';
import { builders as b, AST, preprocess } from '@glimmer/syntax';

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

  // id
  it('binds the id attribute', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, { id: 'default-id' }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div id="default-id"></div>`);

    modifiedTemplate = processTemplate(`{{my-component id="runtime-id"}}`, {
      MustacheStatement(node) {
        return new BuildTimeComponent(node, { id: 'default-id' }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div id="runtime-id"></div>`);

    class MyComponent extends BuildTimeComponent {
      idContent() {
        return 'computed-id';
      }
    }
    modifiedTemplate = processTemplate(`{{my-component id="runtime-id"}}`, {
      MustacheStatement(node) {
        return new MyComponent(node, { id: 'default-id' }).toElement();
      }
    });

    expect(modifiedTemplate).toEqual(`<div id="computed-id"></div>`);
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
          }).toElement();
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

  // positional params
  it('can alias positional params to attributes', function() {
    class MyComponent extends BuildTimeComponent {
      positionalParams = ['icon']
    }

    let modifiedTemplate = processTemplate(`{{my-component "icon-name"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node, { attributeBindings: ['icon'] }).toElement()
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div icon="icon-name"></div>`);
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

  // template
  it('can have a template, which basically inlines it', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>This is the template</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>This is the template</span></div>`);
  });

  it('can have a template with mustaches inside bound to invocation properties with string literals', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span title={{value}}>This is the template with a {{value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value="literal"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span title="literal">This is the template with a literal</span></div>`);
  });

  it('can have a template with mustaches inside bound to invocation properties with number literals', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span title={{value}}>This is the template with a {{value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value=2}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span title="2">This is the template with a 2</span></div>`);
  });

  it('can have a template with mustaches inside bound to invocation properties with boolean literals', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span title={{value}}>This is the template with a {{value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>This is the template with a false</span></div>`);
  });

  it('can have a template with mustaches inside bound to invocation properties with null literals', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span title={{value}}>This is the template with a {{value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value=null}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>This is the template with a </span></div>`);
  });

  it('can have a template with mustaches inside bound to invocation properties with undefined literals', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span title={{value}}>This is the template with a {{value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value=undefined}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>This is the template with a </span></div>`);
  });

  it('can have a template with mustaches inside bound to component properties', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.value = 'static value';
        this.layout`<span title={{value}}>This is the template with a {{value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node, {}).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span title="static value">This is the template with a static value</span></div>`);
  });

  it('can have a template with mustaches inside bound to an initialization option', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span title={{value}}>This is the template with a {{value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node, { value: 'initialization value' }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span title="initialization value">This is the template with a initialization value</span></div>`);
  });

  it('can have a template with mustaches inside bound to an computed values inside <propName>Content', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span title={{value}}>This is the template with a {{value}}</span>`
      }
      valueContent() {
        return 'computed value';
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span title="computed value">This is the template with a computed value</span></div>`);
  });

  it('can have a template with mustaches inside bound to dynamic invocation arguments', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span title={{value}}>This is the template with a {{value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value=fullName}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span title={{fullName}}>This is the template with a {{fullName}}</span></div>`);
  });

  it('can replace paths on mustache arguments with invocation properties containing literals', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value="literal"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component "literal"}}</span></div>`);

    modifiedTemplate = processTemplate(`{{my-component value=4}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component 4}}</span></div>`);

    modifiedTemplate = processTemplate(`{{my-component value=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component true}}</span></div>`);

    modifiedTemplate = processTemplate(`{{my-component value=null}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component null}}</span></div>`);

    modifiedTemplate = processTemplate(`{{my-component value=undefined}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component undefined}}</span></div>`);
  });

  it('can replace paths on mustache hashes with invocation properties containing literals', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component thing=value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value="literal"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing="literal"}}</span></div>`);

    modifiedTemplate = processTemplate(`{{my-component value=4}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing=4}}</span></div>`);

    modifiedTemplate = processTemplate(`{{my-component value=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing=true}}</span></div>`);

    modifiedTemplate = processTemplate(`{{my-component value=null}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing=null}}</span></div>`);

    modifiedTemplate = processTemplate(`{{my-component value=undefined}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing=undefined}}</span></div>`);
  });

  it('can replace paths on mustache arguments with invocation properties containing paths', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value=fullName}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component fullName}}</span></div>`);
  });

  it('can replace paths on mustache hashes with invocation properties containing paths', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component thing=value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value=fullName}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing=fullName}}</span></div>`);
  });

  it('can replace paths on mustache arguments with invocation properties containing subexpressions', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value=(format-date today format="long")}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component (format-date today format="long")}}</span></div>`);
  });

  it('can replace paths on mustache hashes with invocation properties containing subexpressions', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component thing=value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component value=(format-date today format="long")}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing=(format-date today format="long")}}</span></div>`);
  });

  it('can replace paths on mustache arguments with invocation properties static properties', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.value = 'static property';
        this.layout`<span>{{other-component value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component "static property"}}</span></div>`);
  });

  it('can replace paths on mustache hashes with invocation properties static properties', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.value = 'static property';
        this.layout`<span>{{other-component thing=value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing="static property"}}</span></div>`);
  });

  it('can replace paths on mustache arguments with properties options', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node, { value: 'init option' }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component "init option"}}</span></div>`);
  });

  it('can replace paths on mustache hashes with properties options', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component thing=value}}</span>`
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node, { value: 'init option' }).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing="init option"}}</span></div>`);
  });

  it('can replace paths on mustache arguments with computed values', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component value}}</span>`
      }

      valueContent() {
        return 123;
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component 123}}</span></div>`);
  });

  it('can replace paths on mustache hashes with computed values', function() {
    class MyComponent extends BuildTimeComponent {
      constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
        super(node, opts);
        this.layout`<span>{{other-component thing=value}}</span>`
      }

      valueContent() {
        return 123;
      }
    }
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          return new MyComponent(node).toElement();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>{{other-component thing=123}}</span></div>`);
  });

  it('inserts the component\'s block into the {{yield}} keyword');
  it('if the component is blockless, it removes the truthy branch of the {{#if hasBlock}} conditional');
  it('if the component has block, it removes the "else" branch of the {{#if hasBlock}} conditional');
});

