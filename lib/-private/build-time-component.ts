import appendToContent from './append-to-content';
import buildAttr from './build-attr';
import {
  builders as b,
  AST
} from '@glimmer/syntax';

export interface BuildTimeComponentOptions {
  tagName: string,
  classNames: string[],
  ariaHidden: boolean
}

const defaultOptions = {
  tagName: 'div',
  classNames: [],
  ariaHidden: false
}

export default class BuildTimeComponent {
  node: AST.MustacheStatement
  options: BuildTimeComponentOptions

  constructor(node: AST.MustacheStatement, options: object = {}) {
    this.node = node;
    this.options = Object.assign({}, defaultOptions, options);
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
    let attrs = [this.classAttr(), this.ariaHiddenAttr()];
    return <AST.AttrNode[]> attrs.filter(attr => attr !== null);
  }

  classAttr(): AST.AttrNode | null {
    let content;
    if (this.options.classNames.length > 0) {
      content = appendToContent(this.options.classNames.join(' '), content)
    }
    let classPair = this.node.hash.pairs.find((pair) => pair.key === 'class');
    if (classPair !== undefined) {
      content = appendToContent(classPair.value, content);
    }
    return buildAttr('class', content);
  }

  ariaHiddenAttr(): AST.AttrNode | null {
    let content;
    let ariaHiddenPair = this.node.hash.pairs.find((pair) => pair.key === 'ariaHidden');
    if (ariaHiddenPair === undefined) {
      if (this.options.ariaHidden) {
        content = 'true';
      }
    } else if (ariaHiddenPair.value.type === 'BooleanLiteral') {
      content = ariaHiddenPair.value.value ? 'true' : undefined;
    } else {
      content = b.mustache(b.path('if'), [ariaHiddenPair.value, b.string('true')])
    }
    return buildAttr('aria-hidden', content);
  }

  toNode(): AST.ElementNode {
    return b.element(this.tagName, this.attrs);
  }
}
