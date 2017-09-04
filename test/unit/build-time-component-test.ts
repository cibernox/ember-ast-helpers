'use strict';

import processTemplate from '../helpers/process-template';
import { BuildTimeComponent } from '../../lib';

describe('BuildTimeComponent', function() {
  // tagName
  it('generates a div by default', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node);
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div></div>`);
  });

  it('honors the default tagName passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { tagName: 'i' });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<i></i>`);
  });

  it('honors tagName received over any default', function() {
    let modifiedTemplate = processTemplate(`{{my-component tagName="span"}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { tagName: 'i' });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<span></span>`);
  });

  // class
  it('honors the default classNames passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { classNames: ['foo', 'bar'] });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="foo bar"></div>`);
  });

  it('concatenates the default classes and the additional strings passed with the `class` option', function() {
    let modifiedTemplate = processTemplate(`{{my-component class="extra-class"}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNames: ['foo', 'bar'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="foo bar extra-class"></div>`);
  });

  it('concatenates the default classes and the additional boundValue passed with the `class` option', function() {
    let modifiedTemplate = processTemplate(`{{my-component class=extraClass}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNames: ['foo', 'bar'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="foo bar {{extraClass}}"></div>`);
  });

  it('concatenates the default classes and the additional subexpression passed with the `class` option', function() {
    let modifiedTemplate = processTemplate(`{{my-component class=(concat 'a' 'b')}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNames: ['foo', 'bar'] });
          return component.toNode();
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
          let component = new BuildTimeComponent(node, { classNameBindings: ['isActive'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="is-active"></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNameBindings: ['isActive'] });
          return component.toNode();
        }
      }
    });
    expect(modifiedTemplate).toEqual(`<div></div>`);
  });

  it('transform paths to class names', function() {
    let modifiedTemplate = processTemplate(`{{my-component isActive=isActive}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNameBindings: ['isActive'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class={{if isActive "is-active"}}></div>`);
  });

  it('accepts colon syntax to bind attributes to custom classes', function() {
    let modifiedTemplate = processTemplate(`{{my-component isActive=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="on-duty"></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=isActive}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class={{if isActive "on-duty"}}></div>`);
  });

  it('accepts colon syntax to bind attributes to custom classes and its opposite', function() {
    let modifiedTemplate = processTemplate(`{{my-component isActive=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty:reservist'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="on-duty"></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=false}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty:reservist'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="reservist"></div>`);

    modifiedTemplate = processTemplate(`{{my-component isActive=isActive}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { classNameBindings: ['isActive:on-duty:reservist'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class={{if isActive "on-duty" "reservist"}}></div>`);
  });

  it('binds properties passed on initialization to the class', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, {
            classNameBindings: ['isActive:on-duty:reservist'],
            isActive: true
          });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="on-duty"></div>`);

    modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, {
            classNameBindings: ['isActive:on-duty:reservist'],
            isActive: false
          });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="reservist"></div>`);
  });

  it('binds uses the `<propertyName>Content` getter if present, over any passed config or runtime options', function() {
    class SubComponent extends BuildTimeComponent {
      isActiveContent() {
        return 'yeah-baby';
      }
    }

    let modifiedTemplate = processTemplate(`{{my-component isActive=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new SubComponent(node, {
            classNameBindings: ['isActive'],
            isActive: true
          });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="yeah-baby"></div>`);
  });

  it('binds uses the `<propertyName>Content` getter if present along with truthy and falsy classes, over any passed config or runtime options', function() {
    class SubComponent extends BuildTimeComponent {
      isActiveContent() {
        return false;
      }
    }

    let modifiedTemplate = processTemplate(`{{my-component isActive=true}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new SubComponent(node, {
            classNameBindings: ['isActive:on-duty:reservist'],
            isActive: true
          });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div class="reservist"></div>`);
  });

  // attributeBindings
  it('binds properties passed to the constructor passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { title: 'sample title', attributeBindings: ['title'] });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="sample title"></div>`);
  });

  it('binds properties passed to the constructor passed to the constructor to the right attribte', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { title: 'sample title', attributeBindings: ['title:aria-label'] });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-label="sample title"></div>`);
  });

  it('binds properties passed to the constructor passed to the constructor using the truthy class', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { title: 'sample title', attributeBindings: ['title:title:the-title'] });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="the-title"></div>`);
  });

  it('binds properties passed on invocation over those passed in the controller', function() {
    let modifiedTemplate = processTemplate(`{{my-component title="real title"}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { title: 'default title', attributeBindings: ['title'] });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="real title"></div>`);
  });

  it('binds properties passed on invocation over those passed in the controller, to the specified attribute', function() {
    let modifiedTemplate = processTemplate(`{{my-component title="real title"}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { title: 'default title', attributeBindings: ['title:aria-label'] });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-label="real title"></div>`);
  });

  it('binds properties passed on invocation over those passed in the controller using the truthy class', function() {
    let modifiedTemplate = processTemplate(`{{my-component isDisabled=true}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { isDisabled: false, attributeBindings: ['isDisabled:disabled:nope'] });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div disabled="nope"></div>`);
  });

  // block
  it('copies the block over to the element', function() {
    let modifiedTemplate = processTemplate(`{{#my-component title=boundValue}}<span>Inner content</span>{{/my-component}}`, {
      BlockStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node);
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div><span>Inner content</span></div>`);
  })
});
