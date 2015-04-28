(function() {
	'use strict';

	/**
	 * Mix a mixin or traits into a object.
	 * @param  {[type]} tgt [description]
	 * @return {[type]}     [description]
	 */
	function mixin(tgt) {
		for (var i = 1; i < arguments.length; i++) {
			var src = arguments[i];
			for (var prop in src) {
				if (src.hasOwnProperty(prop)) {
					Object.defineProperty(tgt, prop, Object.getOwnPropertyDescriptor(src, prop));
				}
			}
		}
		return tgt;
	}

	/**
	 * Extend an object.
	 * Creates a new object that has the target as its prototype and mix the
	 * other arguments into it.
	 * @param  {[type]} tgt [description]
	 * @return {[type]}     [description]
	 */
	function extend(tgt) {
		var args = Array.prototype.slice.call(arguments);
		var obj = Object.create(tgt);
		args[0] = obj;
		mixin.apply(null, args);
		return obj;
	}

	/**
	 * Extend a class to include mixins.
	 * The difference with simply using mixin on their prototypes is that
	 * this function also calls the constructor of the mixins.
	 * I.e. this function is useful for mixins that needs some kind of initialization.
	 * Since it creates a new class, this function returns a new constructor that should
	 * be used instead of the existing constructor.
	 * @param  {[type]} Tgt [description]
	 * @return {[type]}     [description]
	 */
	function extendClass(Tgt) {
		// Extract the prototypes of all classes passed as arguments.
		var klasses = Array.prototype.slice.call(arguments);
		var prototypes = klasses.map(function(klass) {
			return klass.prototype;
		});

		// Set the classes up so anything done with them is done last with the target class
		// This makes sure that we don't overwrite specializations, and that the target's constructor is called last.
		klasses.shift();
		klasses.push(Tgt);

		// Create a new constructor that calls all the classes' constructors.
		function Extension() {
			for (var i = 0; i < klasses.length; i++) {
				klasses[i].apply(this, arguments);
			}
		}

		// Extend the original prototype with the mixins' prototypes.
		Extension.prototype = extend.apply(null, prototypes);
		Extension.prototype.constructor = Extension;

		// Mixin class methods
		mixin.apply(null, [Extension].concat(klasses));

		// Return the new constructor.
		return Extension;
	}

	/**
	 * Helper function that you can assign to a class property to allow extendClass use
	 * without having your users import properties-pls. Useful for mixins.
	 *
	 * Example:
	 *
	 * 	Foo.extend = extender
	 * 	
	 * @param  {[type]} Mixin [description]
	 * @return {[type]}       [description]
	 */
	function extender(Tgt) {
		extendClass(Tgt, this);
	}

	/**
	 * Create a delegate function for a method of an object.
	 * This function expects 1 argument, the object, and calls the property
	 * on that object with the arguments you supplied.
	 *
	 * Example:
	 *
	 * 	foo.forEach(delegate('updateToNewValue', 200));
	 *
	 * @param  {[type]} propName [description]
	 * @return {[type]}          [description]
	 */
	function delegate(propName) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();

		return function(target) {
			target[propName].apply(target, args);
		};
	}

	/**
	 * Same as delegate, but expects the object to be passed as the this pointer.
	 *
	 * Example:
	 *
	 *   foo.on('ready', delegateThis('removeChildren'))
	 *
	 * @return {[type]} [description]
	 */
	function delegateThis() {
		var delegateFunc = delegate.apply(this, arguments);

		return function() {
			delegateFunc(this);
		}
	}

	/**
	 * Create a chained method from a normal method. Basically just returns the
	 * this pointer.
	 *
	 * Example: 
	 *
	 * 	Foo.prototype.addItems = chained(function() {
	 * 		...
	 * 	});
	 * 
	 * @param  {[type]} func [description]
	 * @return {[type]}      [description]
	 */
	function chained(func) {
		func.apply(this, arguments);
		return this;
	}


	var exported = {
		mixin: mixin,
		extend: extend,
		extendClass: extendClass,
		extender: extender,
		delegate: delegate,
		delegateThis: delegateThis,
		chained: chained,
	};

	// Register AMD module or export to global namespace.
	if (typeof define === "function" && define.amd) {
		define("properties-pls", [], function () {
			return exported;
		});
	}
	else if (typeof exports !== 'undefined') {
		mixin(exports, exported)
	}
	else {
		this.propertiesPls = exported;
	}
}());
