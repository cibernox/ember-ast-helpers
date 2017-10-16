# ember-ast-helpers

This library is a utility belt to make AST transforms and shield users as much as possible from
the nuances of the AST, as it is still private API.



## Helpers

### BuildTimeComponent

This class is the main interface users should use. It gives you a nice declarative way of defining
complex transforms from curly components to HTMLElements that resembles `Ember.Component` in its
API.

#### Basic API

The basic usage is simple:
```js
let component = new BuildTimeComponent(node);
component.toNode()
```

This alone mimics the behaviour of `Ember.Component` in some ways:
- Generates a `div` element
- Binds the `class=` attribute received on invocation to the class on the element.

It also accepts an object with options to configure it, much like `Ember.Component.extend(opts)`:

```js
let component = new BuildTimeComponent(node, {
  tagName: 'span',
  classNames: ['my-component'],
  classNameBindings: ['isActive:is-active:is-disabled'],
  attributeBindings: ['title', 'ariaLabel:aria-label'],
  isActive: true
});
component.toNode()
```

This will be smart enough to generate the appropriate transformations:

| Original                                       | Transformed                          |
|------------------------------------------------|--------------------------------------|
| `{{my-component class="simple-example"}}`      | `<span class="my-component is-active simple-example"></span>` |
| `{{my-component class=someClass}}`      | `<span class="my-component {{someClass}}"></span>` |
| `{{my-component class="simple-example" isActive=false}}`      | `<span class="my-component simple-example"></span>` |
| `{{my-component class="simple-example" isActive=isActive}}`   | `<span class="my-component {{if isActive 'is-active' 'is-disabled'}} simple-example"></span>` |
| `{{my-component class="simple-example" title="Hello" ariaLabel="World"}}`   | `<span class="my-component is-active simple-example" title="Hello" aria-label="World"></span>` |
| `{{my-component class="simple-example" title=title}}`   | `<span class="my-component is-active simple-example" title={{title}}></span>` |

#### Creating your own components
Just as you'd expect from `Ember.Component`, you can subclass `BuildTimeComponent` to configure it
once and reuse it many times, all in a nice ES6 syntax. And `classNames`, `classNameBindings` and
`attributeBindings` work as concatenated properties.

```js
class MyComponent extends BuildTimeComponent {
  constructor(node, { tagName = 'span', isActive = true, ...rest }) {
    super(node, { tagName, isActive, ...rest });
    this.classNames = ['my-component'];
    this.classNameBindings = ['isActive:is-active:is-disabled'];
    this.attributeBindings = ['title', 'ariaLabel:aria-label'];
  }
}
```

In the future once Class properties are implemented (Stage 3 right now) you will be able to DRY up the
code above:

```js
// IMPORTANT, THE CODE BELOW DOES NOT WORK YET UNLESS YOU TRANSPILE IT
class MyComponent extends BuildTimeComponent {
  tagName = 'span'
  classNames = ['my-component']
  classNameBindings = ['isActive:is-active:is-disabled']
  attributeBindings = ['title', 'ariaLabel:aria-label']
  isActive = true
}
```


What about classes/attributes that cannot be expressed with simple bindings?
For that, you can declare functions named `<propName>Content` and that function
will win over runtime options, extension options or invocation options.

To clarify that, you need to understand that there is 4 ways components can get their title:
```js
class Foo extends BuildTimeComponent {
  super(node, opts) {
    super(node, opts);
    this.title = 'Extension time title';
  },

  titleContent() {
    return "Computed title";
  }
}
let component = new Foo(node, { title: 'Initialization-time title' });
```
```hbs
  {{my-foo title="Runtime title"}}
```

The precedence rules are:

1) `<propName>Content(){ }` wins over everything. More on this later.
2) In its absence, the runtime argument (`{{my-foo propName="value"}}`) wins.
3) In the absence of both, the options passed when the component is instantiated (`new Foo(node, { propName: 'value' })`) wins.
4) Lastly if none is provided, the default value when the class is defined is applied.

#### `<propName>Content(){ }` and how to use it

You just read above that the method `<propName>Content` wins over absolutely any other way the user
has to provide `<propName>` to the component. However, typically you will compute the value of a property
based on some inputs. Perhaps the runtime arguments, perhaps the init options, or perhaps all of them.

Within this method, you can access all those values:

1) `this.<propName>` for values assigned with `this.<propName>` inside the constructor
2) `this.options.<propName>` for values passed on the initialization (`new Foo(node, { propName: 'value' })`)
3) `this.attrs.<propName>` for values passed on the template (`{{my-foo propName=value}}`)

#### PositionalParams

Unlike `Ember.Component`, positional params can be listed without reopening the class

```js
class MyLink extends BuildTimeComponent {
  constructor(node, { tagName = 'span', isActive = true, ...rest }) {
    super(node, { tagName, isActive, ...rest });
    this.positionalParams = ['url', 'text'];
    this.attributeBindings = ['url:href', 'text:aria-label'];
  }
}
// {{my-link "foo/bar.html" "About us"}}
```

### Layout

Like regular components, build-time components can define their own layout, using a similar approach
to the one used in `ember-cli-htmlbars-inline-precompile`.
`BuildTimeComponent`s are smart enough to detect if the component is invoked with or without a block,
and simplify conditionals for you, and replace arguments in the templates with the equivalent values
in the parent scope.

P.e, Given a component with a layout like this:
```js
class MyComponent extends BuildTimeComponent {
  constructor(node: BuildTimeComponentNode, opts?: Partial<BuildTimeComponentOptions>) {
    super(node, opts);
    this.layout`
      <span>
        {{other-component thing=value}}
        {{#if hasBlock}}
          {{yield}}
        {{else}}
          <i>Default</i>
          <i>Content</i>
        {{/if}}
      </span>
      <strong>Other content for {{world}}</strong>
    `
  }
```

When it is invoked like this:

```hbs
{{my-component world=planet value="Dog"}}
```

Then it compiles down to:

```hbs
<div>
  <span>
    {{other-component thing="Dog"}}
      <i>Default</i>
      <i>Content</i>
  </span>
  <strong>Other content for {{planet}}</strong>
</div>
```

**NOTE ON TEMPLATES**: It is important to note that since BuildTimeComponents are transformed in compile time,
the template of this kind of components is going to be inlined as many times as times the component is
invoked. If the template is very large and the component is used very often, this can have a negative impact
on the size of the application. Although this kind of repetition compresses very well with gzip, have this
in mind if your component has a large template.

### Other helpers

- `buildAttr(builder, attributeName, content) => AttrNode`:  Content can be pretty much anything. JS Strings, `StringLiteral`s, `TextNode`s, `PathExpression`, `ConcatStatement`s ... Just pass things down, it will do the right thing.

- `appendToContent(builder, content, dataToAppend, options) => newContent`: It takes cares of the nuances of joining content together. It can be used by example to construct the content of an attribute like `class` from several pieces. It accepts pretty much anything. By default it adds a space between values, but that can be changed passing `prependSpace: false` on the options.

- `interpolateProperties(interpolation: string, { divisor = ':', skipIfMissing = true, skipIfMissingDynamic = false, callback })`: A convenient method to generate interpolate values into strings. It accepts an object with options.
P.e: `styleContent: interpolateProperties('color: $color$; background-color: $bgColor$')`
