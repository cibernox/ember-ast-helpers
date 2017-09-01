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

  // ariaHidden
  it('honors the default ariaHidden passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, {
          ariaHidden: true,
          attributeBindings: ['ariaHidden:aria-hidden']
        });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-hidden="true"></div>`);
  });

  it('the boolean passed to ariaHidden trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component ariaHidden=false}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, {
          ariaHidden: true,
          attributeBindings: ['ariaHidden:aria-hidden']
        });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div></div>`);
  });

  it('the path passed to ariaHidden trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component ariaHidden=boundValue}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, {
            ariaHidden: true,
            attributeBindings: ['ariaHidden:aria-hidden']
          });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-hidden={{boundValue}}></div>`);
  });

  it('the path passed to ariaHidden trumps over the default value and uses the true value when provided', function() {
    let modifiedTemplate = processTemplate(`{{my-component ariaHidden=boundValue}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, {
            ariaHidden: true,
            attributeBindings: ['ariaHidden:aria-hidden:secret']
          });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-hidden={{if boundValue "secret"}}></div>`);
  });

  // ariaLabel
  it('honors the default ariaLabel passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, {
          ariaLabel: 'sample ariaLabel',
          attributeBindings: ['ariaLabel:aria-label']
        });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-label="sample ariaLabel"></div>`);
  });

  it('the boolean passed to ariaLabel trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component ariaLabel="other ariaLabel"}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, {
          ariaLabel: 'sample ariaLabel',
          attributeBindings: ['ariaLabel:aria-label']
        });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-label="other ariaLabel"></div>`);
  });

  it('the path passed to ariaLabel trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component ariaLabel=boundValue}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, {
            ariaLabel: 'default aria label',
            attributeBindings: ['ariaLabel:aria-label']
          });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-label={{boundValue}}></div>`);
  });

  // title
  it('honors the default title passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { title: 'sample title', attributeBindings: ['title'] });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="sample title"></div>`);
  });

  it('the boolean passed to title trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component title="other title"}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { title: 'sample title', attributeBindings: ['title'] });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="other title"></div>`);
  });

  it('the path passed to title trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component title=boundValue}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { title: 'default title', attributeBindings: ['title'] });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div title={{boundValue}}></div>`);
  });
});
