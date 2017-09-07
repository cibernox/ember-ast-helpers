import appendToContent from './append-to-content';
import buildAttr, { AttrValue } from './build-attr';
import {
  builders as b,
  traverse,
  AST,
  NodeVisitor
} from '@glimmer/syntax';
// import { uniq } from 'lodash';

function dashify(str: string): string {
  str = str.replace(/([a-z])([A-Z])/g, '$1-$2');
  str = str.replace(/[ \t\W]/g, '-');
  str = str.replace(/^-+|-+$/g, '');
  return str.toLowerCase();
};

// TODO: Extract this helper to a public utility
function buildConditional(cond: AST.PathExpression | AST.SubExpression, truthyValue: string, falsyValue: string | undefined): AST.MustacheStatement {
  let mustacheArgs : AST.Expression[]= [cond];
  mustacheArgs.push(b.string(truthyValue));
  if (falsyValue) {
    mustacheArgs.push(b.string(falsyValue));
  }
  return b.mustache(b.path('if'), mustacheArgs);
}

export type BuildTimeComponentOptions = {
  tagName: string
  classNames: string[]
  ariaHidden: boolean
  title: string | undefined | null
  ariaLabel: string | undefined | null
  classNameBindings: string[]
  attributeBindings: string[]
  contentVisitor?: NodeVisitor
  [key: string]: any
}

export type BuildTimeComponentNode = AST.MustacheStatement | AST.BlockStatement

const defaultOptions : BuildTimeComponentOptions = {
  tagName: 'div',
  classNames: [],
  ariaHidden: false,
  title: undefined,
  ariaLabel: undefined,
  classNameBindings: [],
  attributeBindings: ['class'],
  nodeVisitor: undefined
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
  node: BuildTimeComponentNode
  defaults = Object.assign({}, defaultOptions)
  options: Partial<BuildTimeComponentOptions>
  attrs: { [key: string]: AST.Literal | AST.PathExpression | AST.SubExpression }
  _contentVisitor?: NodeVisitor
  [key: string]: any

  constructor(node: BuildTimeComponentNode, options: Partial<BuildTimeComponentOptions> = {}) {
    this.node = node;
    this.options = options;
    this.attrs = {};
    this._populateAttrs(node);
  }

  // Getters/setters to mimic Ember components
  get tagName(): string {
    let tagName = this.attrs.tagName;
    if (tagName === undefined) {
      return this.options.tagName || this.defaults.tagName;
    } else if (tagName.type === 'StringLiteral') {
      return tagName.value;
    } else {
      throw new Error(`Build-time components cannot receive tagName hash properties with type ${tagName.type}`);
    }
  }
  set tagName(str: string) {
    this.defaults.tagName = str
  }

  get attributeBindings() {
    return this.defaults.attributeBindings.concat(this.options.attributeBindings || [])
  }
  set attributeBindings(attributeBindings: string[]) {
    this.defaults.attributeBindings = this.defaults.attributeBindings.concat(attributeBindings);
  }

  get classNames() {
    return this.defaults.classNames.concat(this.options.classNames || [])
  }
  set classNames(classNames: string[]) {
    this.defaults.classNames = this.defaults.classNames.concat(classNames);
  }

  get classNameBindings() {
    return this.defaults.classNameBindings.concat(this.options.classNameBindings || [])
  }
  set classNameBindings(classNameBindings: string[]) {
    this.defaults.classNameBindings = this.defaults.classNameBindings.concat(classNameBindings);
  }

  // Internal methods
  get contentVisitor(): NodeVisitor | undefined {
    return this._contentVisitor || this.options.contentVisitor;
  }
  set contentVisitor(visitor: NodeVisitor | undefined) {
    this._contentVisitor = visitor;
  }

  get class(): AttrValue | undefined {
    let content: AttrValue | undefined;
    if (this.classNames.length > 0) {
      content = appendToContent(this.classNames.join(' '), content)
    }
    content = this._applyClassNameBindings(content);
    if (this.attrs.class !== undefined) {
      content = appendToContent(this.attrs.class, content);
    }
    return content;
  }

  // Element getters

  /**
   * There is two kind of attributeBindings, boolean or regular.
   *
   * Boolean:
   * - `attributeBinding: ['active:on-duty:reservist']`
   *   when true => `<div active="on-duty">`
   *   when false => `<div active="reservist">`
   *   when dynamic => `<div active={{if active 'on-duty' 'reservist'}}>`
   * - `attributeBinding: ['active:on-duty']`
   *   when true => `<div active="on-duty">`
   *   when false => `<div>`
   *   when dynamic => `<div active={{if active 'on-duty'}}>`
   * - `attributeBinding: ['active']` but we can determine statically that `active` is expected
   *   to be a boolean:
   *   when true => `<div active="true">`
   *   when false => `<div>`
   *   when dynamic => `<div active={{if active 'true'}}>`
   *
   * Regular:
   * - `attributeBinding: ['title']` and we can't determine that title is a boolean in compile time
   *   When the value is static => `<div title="some text">`
   *   When the value is dynamic => `<div title={{title}}>`
   */
  get elementAttrs(): AST.AttrNode[] {
    let attrs: AST.AttrNode[] = [];
    this.attributeBindings.forEach((binding) => {
      let [propName, attrName, valueWhenTrue] = binding.split(':');
      attrName = attrName || propName;
      let attrContent;
      if (this[`${propName}Content`]) {
        let value = this[`${propName}Content`]();
        if (value === undefined || value === null || typeof value === 'boolean' || valueWhenTrue) {
          attrContent = value ? (valueWhenTrue || 'true') : undefined;
        } else {
          attrContent = value;
        }
      } else {
        attrContent = this[propName];
        if (attrContent === undefined) {
          let attr = this.attrs[propName];
          if (attr === undefined) {
            let defaultValue = this.options[propName] || this.defaults[propName];
            if (defaultValue !== undefined && defaultValue !== null) {
              if (typeof defaultValue === 'boolean') {
                attrContent = defaultValue ? (valueWhenTrue || 'true') : undefined;
              } else {
                attrContent = valueWhenTrue ? valueWhenTrue : defaultValue;
              }
            }
          } else if (attr.type === 'PathExpression' && valueWhenTrue) {
            attrContent = b.mustache(b.path('if'), [attr, b.string(valueWhenTrue)])
          } else if (attr.type === 'BooleanLiteral' && valueWhenTrue) {
            attrContent = attr.value ? valueWhenTrue : undefined;
          } else {
            attrContent = valueWhenTrue ? valueWhenTrue : attr;
          }
        }
      }
      let attr = buildAttr(attrName, attrContent)
      if (attr !== null) {
        attrs.push(attr);
      }
    });
    return attrs;
  }

  get elementModifiers(): AST.ElementModifierStatement[] {
    return [];
  }

  get elementChildren(): AST.Statement[] {
    if (this.node.type === 'BlockStatement') {
      if (this.contentVisitor) {
        traverse(this.node.program, this.contentVisitor)
      }
      return this.node.program.body;
    } else {
      return [];
    }
  }

  toElement(): AST.ElementNode {
    return b.element(this.tagName, this.elementAttrs, this.elementModifiers, this.elementChildren);
  }

  // private
  _populateAttrs(node: BuildTimeComponentNode) {
    node.hash.pairs.forEach((pair) => {
      this.attrs[pair.key] = pair.value;
    });
  }

  /**
   * There is two possible kinds of classNameBindings: boolean or regular
   *
   * Boolean bindings are those that must be interpreted by the truthyness or falsyness of the
   * property they are bound to.
   *
   * A bindings is deemed boolean when either of this conditions is met:
   * - If the binding definition contains truthy or falsy values, it always considered boolean,
   *   regardless of the type of value on that property. E.g: `classNameBindings: ['enabled:on:off']`
   *
   * - If the binding has no truthy/falsy values but its property has been initialized to a boolean
   *   value, then it's reasonably safe that the developer expects it to be a boolean. In that case,
   *   just like Ember.Component does, the truthy value will be the dasherized name of the property,
   *   and when false, it won't have a false value.
   *   E.g. `new BuildTimeComponent(node, { classNameBindings: ['isActive'], isActive: true })` will
   *   generate `<div class="is-active"></div>`. If the component is invoked with a dynamic value
   *   on that property (`{{my-foo isActive=condition}}`) it generates `<div class={{if condition "is-active"}}></div>`
   *
   * - If the binding doesn't have truthy/falsy values, and the property hasn't been initialized to
   *   a boolean value, but the invocation passed the property as a boolean literal, it's also
   *   considered a boolean.
   *   E.g. `new BuildTimeComponent(node, { classNameBindings: ['isActive']})` invoked with
   *   `{{my-foo isActive=true}}` will generate `<div class="is-active"></div>`
   *
   * Regular bindings are simpler than that. If the value is just added to the class. If we can
   * determine the value in compile time, it will generate `<div class="a b c propValue"></div>`,
   * and if it can't, it will be interpolated `<div class="a b c {{prop}}"></div>`
   */
  _applyClassNameBindings(content: AttrValue | undefined): AttrValue | undefined {
    this.classNameBindings.forEach((binding) => {
      let bindingParts = binding.split(':');
      let isBooleanBinding = bindingParts.length > 1;
      let [propName, truthyClass, falsyClass] = bindingParts;
      let attr = this.attrs[propName];
      let computedValue, staticValue;
      if (this[`${propName}Content`]) {
        computedValue = this[`${propName}Content`]();
      } else {
        staticValue = this.options[propName] !== undefined ? this.options[propName] : this.defaults[propName];
        if (staticValue === undefined) {
          staticValue = this[propName];
        }
      }
      if (!isBooleanBinding) {
        if (typeof computedValue === 'boolean') {
          isBooleanBinding = true;
        }
        if (!isBooleanBinding && staticValue === undefined && attr !== undefined && attr.type === 'BooleanLiteral') {
          isBooleanBinding = true;
        } else {
          isBooleanBinding = typeof staticValue === 'boolean';
        }
      }

      if (isBooleanBinding) {
        truthyClass = truthyClass || dashify(propName);
        if (computedValue) {
          let part = computedValue ? truthyClass : falsyClass;
          if (part) {
            content = appendToContent(part, content);
          }
        } else if (attr) {
          if (AST.isLiteral(attr)) {
            let part = attr.value ? truthyClass : falsyClass;
            if (part) {
              content = appendToContent(part, content);
            }
          } else {
            content = appendToContent(buildConditional(attr, truthyClass, falsyClass), content)
          }
        } else {
          content = appendToContent(staticValue ? truthyClass : falsyClass, content);
        }
      } else {
        content = appendToContent(computedValue || attr || staticValue, content);
      }
    });
    return content;
  }
}
