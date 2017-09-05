declare module 'dashify' {
  export default function(input: string): string;
}

declare module 'ember-source/dist/ember.prod.js' {
  namespace Ember {
    class Mixin {
      apply(obj: any): any;
      /**
      Creates an instance of the class.
      @param arguments A hash containing values with which to initialize the newly instantiated object.
      **/
      static create<T extends Mixin>(...args: CoreObjectArguments[]): T;
      detect(obj: any): boolean;
      reopen<T extends Mixin>(args?: {}): T;
    }

    interface CoreObjectArguments {
      /**
      An overridable method called when objects are instantiated. By default, does nothing unless it is
      overridden during class definition. NOTE: If you do override init for a framework class like Ember.View
      or Ember.ArrayController, be sure to call this._super() in your init declaration! If you don't, Ember
      may not have an opportunity to do important setup work, and you'll see strange behavior in your application.
      **/
      init?: Function;
      /**
      Override to implement teardown.
      **/
      willDestroy?: Function;

      [propName: string]: any;
    }

    class CoreObject {
      /**
      An overridable method called when objects are instantiated. By default,
      does nothing unless it is overridden during class definition.
      @method init
      **/
      init(): void;

      /**
      Defines the properties that will be concatenated from the superclass (instead of overridden).
      @property concatenatedProperties
      @type Array
      @default null
      **/
      concatenatedProperties: any[];

      /**
      Destroyed object property flag. If this property is true the observers and bindings were
      already removed by the effect of calling the destroy() method.
      @property isDestroyed
      @default false
      **/
      isDestroyed: boolean;
      /**
      Destruction scheduled flag. The destroy() method has been called. The object stays intact
      until the end of the run loop at which point the isDestroyed flag is set.
      @property isDestroying
      @default false
      **/
      isDestroying: boolean;

      /**
      Destroys an object by setting the `isDestroyed` flag and removing its
      metadata, which effectively destroys observers and bindings.
      If you try to set a property on a destroyed object, an exception will be
      raised.
      Note that destruction is scheduled for the end of the run loop and does not
      happen immediately.  It will set an isDestroying flag immediately.
      @method destroy
      @return {Ember.Object} receiver
      */
      destroy(): CoreObject;

      /**
      Override to implement teardown.
      @method willDestroy
      */
      willDestroy(): void;

      /**
      Returns a string representation which attempts to provide more information than Javascript's toString
      typically does, in a generic way for all Ember objects (e.g., "<App.Person:ember1024>").
      @method toString
      @return {String} string representation
      **/
      toString(): string;

      static isClass: boolean;
      static isMethod: boolean;

      /**
      Creates a new subclass.
      @method extend
      @static
      @param {Mixin} [mixins] - One or more Mixin classes
      @param {Object} [args] - Object containing values to use within the new class
      **/
      static extend<T>(args?: CoreObjectArguments): T;
      static extend<T>(mixin1: Mixin, args?: CoreObjectArguments): T;
      static extend<T>(mixin1: Mixin, mixin2: Mixin, args?: CoreObjectArguments): T;

      /**
      Creates a new subclass.
      @method extend
      @param {Mixin} [mixins] - One or more Mixin classes
      @param {Object} [args] - Object containing values to use within the new class
      Non-static method because Ember classes aren't currently 'real' TypeScript classes.
      **/
      extend<T>(mixin1?: Mixin, mixin2?: Mixin, args?: CoreObjectArguments): T;

      /**
      Equivalent to doing extend(arguments).create(). If possible use the normal create method instead.
      @method createWithMixins
      @static
      @param [args]
      **/
      static createWithMixins<T extends {}>(args?: {}): T;

      /**
      Creates an instance of the class.
      @method create
      @static
      @param [args] - A hash containing values with which to initialize the newly instantiated object.
      **/
      static create<T extends {}>(args?: {}): T;

      /**
      Augments a constructor's prototype with additional properties and functions.
      To add functions and properties to the constructor itself, see reopenClass.
      @method reopen
      **/
      static reopen<T extends {}>(args?: {}): T;

      /**
      Augments a constructor's own properties and functions.
      To add functions and properties to instances of a constructor by extending the
      constructor's prototype see reopen.
      @method reopenClass
      **/
      static reopenClass<T extends {}>(args?: {}): T;

      static detect(obj: any): boolean;
      static detectInstance(obj: any): boolean;

      /**
      Returns the original hash that was passed to meta().
      @method metaForProperty
      @static
      @param key {String} property name
      **/
      static metaForProperty(key: string): {};

      /**
      Iterate over each computed property for the class, passing its name and any
      associated metadata (see metaForProperty) to the callback.

      @method eachComputedProperty
      @static
      @param {Function} callback
      @param {Object} binding
      **/
      static eachComputedProperty(callback: Function, binding: {}): void;
    }
  }

  export default Ember;
}
