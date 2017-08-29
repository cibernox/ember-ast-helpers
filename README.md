# ember-ast-helpers

This library is an utility belt to make AST transforms and shield users as much as possible from
the nuances of the AST, as it still private API.

#### Helpers

- `buildAttr(builder, attributeName, content) => AttrNode`:  Content can be pretty much anything. JS Strings, `StringLiteral`s, `TextNode`s, `PathExpression`, `ConcatStatement`s ... Just pass things down, it will do the right thing.
- `appendToContent(builder, content, dataToAppend, options) => newContent`: It takes cares of the nuances of joining content together. It can be used by example to construct the content of an attribute
like `class` from several pieces. It accepts pretty much anything. By default it adds a space between values, but that can be changed passing `prependSpace: false` on the options.