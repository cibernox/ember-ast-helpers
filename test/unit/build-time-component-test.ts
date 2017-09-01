'use strict';

// import { builders as b } from '@glimmer/syntax';
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

  // ariaHidden
  it('honors the default ariaHidden passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { ariaHidden: true });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-hidden="true"></div>`);
  });

  it('the boolean passed to ariaHidden trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component ariaHidden=false}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { ariaHidden: true });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div></div>`);
  });

  it('the path passed to ariaHidden trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component ariaHidden=boundValue}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { ariaHidden: true });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-hidden={{if boundValue "true"}}></div>`);
  });

  // ariaLabel
  it('honors the default ariaLabel passed to the constructor', function() {
    let modifiedTemplate = processTemplate(`{{my-component}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { ariaLabel: 'sample ariaLabel' });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-label="sample ariaLabel"></div>`);
  });

  it('the boolean passed to ariaLabel trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component ariaLabel="other ariaLabel"}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { ariaLabel: 'sample ariaLabel' });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div aria-label="other ariaLabel"></div>`);
  });

  it('the path passed to ariaLabel trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component ariaLabel=boundValue}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { ariaLabel: true });
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
        let component = new BuildTimeComponent(node, { title: 'sample title' });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="sample title"></div>`);
  });

  it('the boolean passed to title trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component title="other title"}}`, {
      MustacheStatement(node) {
        let component = new BuildTimeComponent(node, { title: 'sample title' });
        return component.toNode();
      }
    });

    expect(modifiedTemplate).toEqual(`<div title="other title"></div>`);
  });

  it('the path passed to title trumps over the default value', function() {
    let modifiedTemplate = processTemplate(`{{my-component title=boundValue}}`, {
      MustacheStatement(node) {
        if (node.path.original === 'my-component') {
          let component = new BuildTimeComponent(node, { title: true });
          return component.toNode();
        }
      }
    });

    expect(modifiedTemplate).toEqual(`<div title={{boundValue}}></div>`);
  });
});
