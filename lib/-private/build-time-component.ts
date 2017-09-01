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

export default class BuildTimeComponent {
  node: AST.MustacheStatement
  options: BuildTimeComponentOptions
  [key: string]: any

  constructor(node: AST.MustacheStatement, options: Partial<BuildTimeComponentOptions> = {}) {
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
      let [propName, attrName] = binding.split(':');
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
              attrContent = defaultValue ? 'true' : undefined;
            } else {
              attrContent = defaultValue;
            }
          }
        } else {
          attrContent = pair.value;
        }
      }
      let attr = buildAttr(attrName, attrContent)
      if (attr !== null) {
        attrs.push(attr);
      }
    });
    return attrs;
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
      if (bindingParts.length === 1) {
        bindingParts.push(dashify(bindingParts[0]));
      }
      let [propName, truthyClass, falsyClass] = bindingParts;
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
    });
    return content;
  }

  toNode(): AST.ElementNode {
    return b.element(this.tagName, this.attrs);
  }
}
