import Ember from 'ember-source/dist/ember.prod.js';

export default <Ember.CoreObject> Ember.CoreObject.extend({
  tagName: 'div',

  toNode() {
    return undefined;
  }
});


// import appendToContent from './append-to-content';
// import buildAttr from './build-attr';
// import {
//   builders as b,
//   traverse,
//   AST,
//   NodeVisitor
// } from '@glimmer/syntax';
// import { uniq } from 'lodash';

// function dashify(str: string): string {
//   str = str.replace(/([a-z])([A-Z])/g, '$1-$2');
//   str = str.replace(/[ \t\W]/g, '-');
//   str = str.replace(/^-+|-+$/g, '');
//   return str.toLowerCase();
// };

// export type BuildTimeComponentOptions = {
//   tagName: string
//   classNames: string[]
//   ariaHidden: boolean
//   title: string | undefined | null
//   ariaLabel: string | undefined | null
//   classNameBindings: string[]
//   attributeBindings: string[]
//   contentVisitor?: NodeVisitor
//   [key: string]: any
// }

// export type BuildTimeComponentNode = AST.MustacheStatement | AST.BlockStatement

// const defaultOptions : BuildTimeComponentOptions = {
//   tagName: 'div',
//   classNames: [],
//   ariaHidden: false,
//   title: undefined,
//   ariaLabel: undefined,
//   classNameBindings: [],
//   attributeBindings: ['class'],
//   nodeVisitor: undefined
// }

// /**
//  * This is supposed to be the main abstraction used by most people to achieve most of their works
//  * Only when they want to do something extra the can override methods and do it themselves.
//  *
//  * It has some basic behaviour by default to remind how "real" ember components work, but very little.
//  * Namely, the `class` property is automatically bound to `class` attribute in the resulting HTMLElement.
//  * Also, if on initialization the user passes `classNames`, the classes in that array will be concatenated
//  * with the value passed to `class`.
//  * The user can also pass default values for the properties the component doesn't receive on invocation.
//  *
//  * That object has two main properties to help working with this abstraction useful.
//  *
//  * - `classNameBindings`: Identical behavior to the one in Ember components
//  * - `attributeBindings`: Almost identical behaviour to the one in Ember components, with one enhancements.
//  *   Some attributes are expected to have regular values (p.e. the `title` attribute must have a string),
//  *   so `{{my-component title=username}}` compiles to `<div title={{username}}></div>`.
//  *   However, there is properties that are expected to be boolean that when converted to attributes
//  *   should have other values. That is why you can pass `attributeBindings: ['isDisabled:disabled:no']`
//  *   You will notice that in regular Ember components, the items in attribute bindings only have one `:`
//  *   dividing propertyName and attributeName. If you put two semicolons dividing the string in three parts
//  *   the third part will be used for the truthy value, generating in the example above `<div disabled={{if disabled 'no'}}></div>`
//  *
//  * More example usages:
//  *
//  * let component = new BuildTimeComponent(node); // creates the component
//  * component.toNode(); // generates the element with the right markup
//  *
//  * let soldier = new BuildTimeComponent(node, {
//  *   classNameBindings: ['active:is-deployed:reservist'],
//  *   attributeBindings: ['title', 'url:href', 'ariaHidden:aria-hidden:true']
//  * });
//  */

// export default class BuildTimeComponent {
//   node: BuildTimeComponentNode
//   defaults = Object.assign({}, defaultOptions)
//   options: Partial<BuildTimeComponentOptions>
//   attrs: { [key: string]: AST.Literal | AST.PathExpression | AST.SubExpression }
//   _contentVisitor?: NodeVisitor
//   [key: string]: any

//   constructor(node: BuildTimeComponentNode, options: Partial<BuildTimeComponentOptions> = {}) {
//     this.node = node;
//     this.options = options;
//     this.attrs = {};
//     this._populateAttrs(node);
//   }

//   get tagName(): string {
//     let tagName = this.attrs.tagName;
//     if (tagName === undefined) {
//       return this.options.tagName || this.defaults.tagName;
//     } else if (tagName.type === 'StringLiteral') {
//       return tagName.value;
//     } else {
//       throw new Error(`Build-time components cannot receive tagName hash properties with type ${tagName.type}`);
//     }
//   }
//   set tagName(str: string) {
//     this.defaults.tagName = str
//   }

//   get contentVisitor(): NodeVisitor | undefined {
//     return this._contentVisitor || this.options.contentVisitor;
//   }
//   set contentVisitor(visitor: NodeVisitor | undefined) {
//     this._contentVisitor = visitor;
//   }

//   get class(): AST.TextNode | AST.MustacheStatement | AST.ConcatStatement | undefined {
//     let content: AST.TextNode | AST.MustacheStatement | AST.ConcatStatement | undefined;
//     if (this.classNames.length > 0) {
//       content = appendToContent(this.classNames.join(' '), content)
//     }
//     if (this.attrs.class !== undefined) {
//       content = appendToContent(this.attrs.class, content);
//     }
//     this.classNameBindings.forEach((binding) => {
//       let bindingParts = binding.split(':');
//       let [propName, truthyClass, falsyClass] = bindingParts;
//       if (this[`${propName}Content`]) {
//         let value = this[`${propName}Content`]();
//         if (value === null || value === undefined || typeof value === 'boolean') {
//           truthyClass = truthyClass || dashify(propName);
//           if (value) {
//             content = appendToContent(truthyClass, content);
//           } else if (falsyClass) {
//             content = appendToContent(falsyClass, content);
//           }
//         } else {
//           content = appendToContent(value, content);
//         }
//         return;
//       }
//       let attr = this.attrs[propName];
//       if (attr) {
//         if (attr.type === 'BooleanLiteral' || attr.type === 'NullLiteral' || attr.type === 'UndefinedLiteral') {
//           truthyClass = truthyClass || dashify(propName);
//           if (!!attr.value) {
//             content = appendToContent(truthyClass, content);
//           } else if (falsyClass) {
//             content = appendToContent(falsyClass, content);
//           }
//         } else if (attr.type === 'StringLiteral' || attr.type === 'NumberLiteral') {
//           content = appendToContent(attr.value, content);
//         } else if (attr.type === 'PathExpression') {
//           if (truthyClass) {
//             let mustacheArgs = [attr, b.string(truthyClass)];
//             if (falsyClass) {
//               mustacheArgs.push(b.string(falsyClass));
//             }
//             content = appendToContent(b.mustache(b.path('if'), mustacheArgs), content);
//           } else {
//             content = appendToContent(b.mustache(attr), content);
//           }
//         } else if (attr.type === 'SubExpression') {
//           if (truthyClass) {
//             let mustacheArgs = [attr, b.string(truthyClass)];
//             if (falsyClass) {
//               mustacheArgs.push(b.string(falsyClass));
//             }
//             content = appendToContent(b.mustache(b.path('if'), mustacheArgs), content);
//           } else {
//             content = appendToContent(b.mustache(attr.path, attr.params, attr.hash), content);
//           }
//         }
//       } else {
//         let propValue = this.options[propName] !== undefined ? this.options[propName] : this.defaults[propName];
//         if (propValue === undefined) {
//           propValue = this[propName];
//         }
//         if (typeof propValue === 'boolean' || truthyClass) {
//           truthyClass = truthyClass || dashify(propName);
//           if (propValue) {
//             content = appendToContent(truthyClass, content);
//           } else if (falsyClass) {
//             content = appendToContent(falsyClass, content);
//           }
//         } else if (propValue !== undefined) {
//           content = appendToContent(propValue, content);
//         }
//       }
//     });
//     return content;
//   }

//   // Concatenated properties
//   get attributeBindings() {
//     return this.defaults.attributeBindings.concat(this.options.attributeBindings || [])
//   }
//   set attributeBindings(bindings: string[]) {
//     this.options.attributeBindings = uniq(this.options.attributeBindings || []).concat(bindings);
//   }

//   get classNames() {
//     return this.defaults.classNames.concat(this.options.classNames || [])
//   }
//   set classNames(classNames: string[]) {
//     this.options.classNames = uniq((this.options.classNames || []).concat(classNames));
//   }

//   get classNameBindings() {
//     return this.defaults.classNameBindings.concat(this.options.classNameBindings || [])
//   }
//   set classNameBindings(classNameBindings: string[]) {
//     this.options.classNameBindings = uniq((this.options.classNameBindings || []).concat(classNameBindings));
//   }

//   // Node getters
//   get nodeAttrs(): AST.AttrNode[] {
//     let attrs: AST.AttrNode[] = [];
//     this.attributeBindings.forEach((binding) => {
//       let [propName, attrName, valueWhenTrue] = binding.split(':');
//       attrName = attrName || propName;
//       let attrContent;
//       if (this[`${propName}Content`]) {
//         let value = this[`${propName}Content`]();
//         if (value === undefined || value === null || typeof value === 'boolean' || valueWhenTrue) {
//           attrContent = value ? (valueWhenTrue || 'true') : undefined;
//         } else {
//           attrContent = value;
//         }
//       } else {
//         attrContent = this[propName];
//         if (attrContent === undefined) {
//           let attr = this.attrs[propName];
//           if (attr === undefined) {
//             let defaultValue = this.options[propName] || this.defaults[propName];
//             if (defaultValue !== undefined && defaultValue !== null) {
//               if (typeof defaultValue === 'boolean') {
//                 attrContent = defaultValue ? (valueWhenTrue || 'true') : undefined;
//               } else {
//                 attrContent = valueWhenTrue ? valueWhenTrue : defaultValue;
//               }
//             }
//           } else if (attr.type === 'PathExpression' && valueWhenTrue) {
//             attrContent = b.mustache(b.path('if'), [attr, b.string(valueWhenTrue)])
//           } else if (attr.type === 'BooleanLiteral' && valueWhenTrue) {
//             attrContent = attr.value ? valueWhenTrue : undefined;
//           } else {
//             attrContent = valueWhenTrue ? valueWhenTrue : attr;
//           }
//         }
//       }
//       let attr = buildAttr(attrName, attrContent)
//       if (attr !== null) {
//         attrs.push(attr);
//       }
//     });
//     return attrs;
//   }

//   get nodeModifiers(): AST.ElementModifierStatement[] {
//     return [];
//   }

//   get nodeChildren(): AST.Statement[] {
//     if (this.node.type === 'BlockStatement') {
//       if (this.contentVisitor) {
//         traverse(this.node.program, this.contentVisitor)
//       }
//       return this.node.program.body;
//     } else {
//       return [];
//     }
//   }

//   toNode(): AST.ElementNode {
//     return b.element(this.tagName, this.nodeAttrs, this.nodeModifiers, this.nodeChildren);
//   }

//   // private
//   _populateAttrs(node: BuildTimeComponentNode) {
//     node.hash.pairs.forEach((pair) => {
//       this.attrs[pair.key] = pair.value;
//     });
//   }
// }
