import appendToContent from './append-to-content';
import buildAttr from './build-attr';
import {
  builders as b,
  AST
} from '@glimmer/syntax';

function dashify(str: string): string {
  str = str.replace(/([a-z])([A-Z])/g, '$1-$2');
  str = str.replace(/[ \t\W]/g, '-');
  str = str.replace(/^-+|-+$/g, '');
  return str.toLowerCase();
};

export type BuildTimeComponentOptions = {
  tagName: string
  classNames: string[]
  ariaHidden: boolean
  title: string | undefined | null
  ariaLabel: string | undefined | null
  classNameBindings: string[]
  attributeBindings: string[]
  [key: string]: any
}

const defaultOptions : BuildTimeComponentOptions = {
  tagName: 'div',
  classNames: [],
  ariaHidden: false,
  title: undefined,
  ariaLabel: undefined,
  classNameBindings: [],
  attributeBindings: ['class']
}

/**
 * This is supposed to be the main abstraction used by most people to achieve most of their works
 * Only when they want to do something extra the can override methods and do it themselves.
 *
 * It has some basic behaviour by default to remind how "real" ember components work, but very little.
 * Namely, the `class` property is automatically bound to `class` attribute in the resulting HTMLElement.
 * Also, if on initialization the user passes `classNames`, the classes in that array will be concatenated
 * with the value passed to `class`.
 * The user can also pass default values for the properties the component doesn't receive on invocation.
 *
 * That object has two main properties to help working with this abstraction useful.
 *
 * - `classNameBindings`: Identical behavior to the one in Ember components
 * - `attributeBindings`: Almost identical behaviour to the one in Ember components, with one enhancements.
 *   Some attributes are expected to have regular values (p.e. the `title` attribute must have a string),
 *   so `{{my-component title=username}}` compiles to `<div title={{username}}></div>`.
 *   However, there is properties that are expected to be boolean that when converted to attributes
 *   should have other values. That is why you can pass `attributeBindings: ['isDisabled:disabled:no']`
 *   You will notice that in regular Ember components, the items in attribute bindings only have one `:`
 *   dividing propertyName and attributeName. If you put two semicolons dividing the string in three parts
 *   the third part will be used for the truthy value, generating in the example above `<div disabled={{if disabled 'no'}}></div>`
 *
 * More example usages:
 *
 * let component = new BuildTimeComponent(node); // creates the component
 * component.toNode(); // generates the element with the right markup
 *
 * let soldier = new BuildTimeComponent(node, {
 *   classNameBindings: ['active:is-deployed:reservist'],
 *   attributeBindings: ['title', 'url:href', 'ariaHidden:aria-hidden:true']
 * });
 */

export default class BuildTimeComponent {
  node: AST.MustacheStatement | AST.BlockStatement
  options: BuildTimeComponentOptions
  [key: string]: any

  constructor(node: AST.MustacheStatement | AST.BlockStatement, options: Partial<BuildTimeComponentOptions> = {}) {
    this.node = node;
    this.options = Object.assign({}, defaultOptions, options);
    this.options.attributeBindings = defaultOptions.attributeBindings.concat(options.attributeBindings || []);
  }

  get tagName(): string {
    let tagNamePair = this.node.hash.pairs.find((pair) => pair.key === 'tagName');
    if (tagNamePair === undefined) {
      return this.options.tagName;
    } else if (tagNamePair.value.type === 'StringLiteral') {
      return tagNamePair.value.value;
    } else {
      throw new Error(`Build-time components cannot receive tagName hash properties with type ${tagNamePair.value.type}`);
    }
  }

  get attrs(): AST.AttrNode[] {
    let attrs: AST.AttrNode[] = [];
    this.options.attributeBindings.forEach((binding) => {
      let [propName, attrName, valueWhenTrue] = binding.split(':');
      attrName = attrName || propName;
      let attrContent;
      if (this[`${propName}Content`]) {
        attrContent = this[`${propName}Content`]();
      } else {
        let pair = this.node.hash.pairs.find((pair) => pair.key === propName);
        if (pair === undefined) {
          if (this.options[propName] !== undefined && this.options[propName] !== null) {
            let defaultValue = this.options[propName];
            if (typeof defaultValue === 'boolean') {
              attrContent = defaultValue ? (valueWhenTrue || 'true') : undefined;
            } else {
              attrContent = valueWhenTrue ? valueWhenTrue : defaultValue;
            }
          }
        } else if (pair.value.type === 'PathExpression' && valueWhenTrue) {
          attrContent = b.mustache(b.path('if'), [pair.value, b.string(valueWhenTrue)])
        } else if (pair.value.type === 'BooleanLiteral' && valueWhenTrue) {
          attrContent = pair.value.value ? valueWhenTrue : undefined;
        } else {
          attrContent = valueWhenTrue ? valueWhenTrue : pair.value;
        }
      }
      let attr = buildAttr(attrName, attrContent)
      if (attr !== null) {
        attrs.push(attr);
      }
    });
    return attrs;
  }

  get modifiers(): AST.ElementModifierStatement[] {
    return [];
  }

  get children(): AST.Statement[] {
    if (this.node.type === 'BlockStatement') {
      return this.node.program.body;
    } else {
      return [];
    }
  }

  classContent(): AST.TextNode | AST.MustacheStatement | AST.ConcatStatement | undefined {
    let content: AST.TextNode | AST.MustacheStatement | AST.ConcatStatement | undefined;
    if (this.options.classNames.length > 0) {
      content = appendToContent(this.options.classNames.join(' '), content)
    }
    let classPair = this.node.hash.pairs.find((pair) => pair.key === 'class');
    if (classPair !== undefined) {
      content = appendToContent(classPair.value, content);
    }
    this.options.classNameBindings.forEach((binding) => {
      let bindingParts = binding.split(':');
      let [propName, truthyClass, falsyClass] = bindingParts;
      if (this[`${propName}Content`]) {
        let attrContent = this[`${propName}Content`]();
        truthyClass = truthyClass || attrContent;
        if (!!attrContent) {
          content = appendToContent(truthyClass, content);
        } else if (falsyClass) {
          content = appendToContent(falsyClass, content);
        }
      } else {
        if (bindingParts.length === 1) {
          truthyClass = dashify(bindingParts[0]);
        }
        let pair = this.node.hash.pairs.find((p) => p.key === propName);
        if (pair === undefined) {
          if (!!this.options[propName]) {
            content = appendToContent(truthyClass, content);
          } else if (falsyClass) {
            content = appendToContent(falsyClass, content);
          }
        } else if (AST.isLiteral(pair.value)) {
          if (!!pair.value.value) {
            content = appendToContent(truthyClass, content);
          } else if (falsyClass) {
            content = appendToContent(falsyClass, content);
          }
        } else {
          let mustacheArgs = [pair.value, b.string(truthyClass)];
          if (falsyClass) {
            mustacheArgs.push(b.string(falsyClass));
          }
          content = appendToContent(b.mustache(b.path('if'), mustacheArgs), content);
        }
      }
    });
    return content;
  }

  toNode(): AST.ElementNode {
    return b.element(this.tagName, this.attrs, this.modifiers, this.children);
  }
}
