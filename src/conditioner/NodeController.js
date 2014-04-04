/**
 * @exports NodeController
 * @class
 * @constructor
 * @param {Object} element
 * @param {Number} priority
 */
var NodeController = function(element,priority) {

	if (!element) {
		throw new Error('NodeController(element): "element" is a required parameter.');
	}

	// set element reference
	this._element = element;

	// has been processed
	this._element.setAttribute('data-processed','true');

	// set priority
    this._priority = !priority ? 0 : parseInt(priority,10);

	// contains references to all module controllers
	this._moduleControllers = [];

    // binds
    this._moduleLoadBind = this._onModuleLoad.bind(this);
    this._moduleUnloadBind = this._onModuleUnload.bind(this);

};

/**
 * Static method testing if the current element has been processed already
 * @param {Element} element
 * @static
 */
NodeController.hasProcessed = function(element) {
	return element.getAttribute('data-processed') === 'true';
};

NodeController.prototype = {

	/**
	 * Loads the passed module controllers to the node
     * @param {...} arguments
	 * @public
	 */
	load:function() {

        // if no module controllers found
        if (!arguments || !arguments.length) {
            throw new Error('NodeController.load(controllers): Expects an array of module controllers as parameters.');
        }

		// turn into array
        this._moduleControllers = Array.prototype.slice.call(arguments,0);

        // listen to load events on module controllers
		var i=0,l=this._moduleControllers.length;
		for (;i<l;i++) {
			Observer.subscribe(this._moduleControllers[i],'load',this._moduleLoadBind);
        }

	},

    /**
     * Unload all attached modules and restore node in original state
     * @public
     */
    destroy:function() {

        var i=0,l=this._moduleControllers.length;
        for (;i<l;i++) {
            this._destroyModuleController(this._moduleControllers[i]);
        }

        // reset array
        this._moduleControllers = [];

        // update initialized state
        this._updateInitialized();

        // reset processed state
        this._element.removeAttribute('data-processed');

        // reset element reference
        this._element = null;
    },

    /**
     * Call destroy method on module controller and clean up listeners
     * @param moduleController
     * @private
     */
    _destroyModuleController:function(moduleController) {

        // unsubscribe from module events
        Observer.unsubscribe(moduleController,'load',this._moduleLoadBind);
        Observer.unsubscribe(moduleController,'unload',this._moduleUnloadBind);

        // conceal events from module controller
        Observer.conceal(moduleController,this);

        // unload the controller
        moduleController.destroy();

    },

	/**
	 * Returns the set priority for this node
	 * @public
	 */
	getPriority:function() {
		return this._priority;
	},

	/**
	 * Returns the element linked to this node
	 * @public
	 */
	getElement:function() {
		return this._element;
	},

	/**
	 * Public method to check if the module matches the given query
	 * @param {String} selector - CSS selector to match module to
	 * @param {Document|Element} [context] - Context to search in
	 * @return {Boolean}
	 * @public
	 */
	matchesSelector:function(selector,context) {

		if (context && !contains(context,this._element)) {
			return false;
		}

		return matchesSelector(this._element,selector,context);
	},

	/**
	 * Returns true if all module controllers are active
	 * @public
	 */
    areModulesActive:function() {
        return this.getActiveModuleControllers().length === this._moduleControllers.length;
    },

	/**
	 * Returns an array containing all active module controllers
	 * @return {Array}
	 * @public
	 */
	getActiveModuleControllers:function() {

        var i=0,l=this._moduleControllers.length,controller,results = [];
        for (;i<l;i++) {
            controller = this._moduleControllers[i];
            if (controller.isModuleActive()) {
                results.push(controller);
            }
        }
        return results;
    },

	/**
	 * Returns the first ModuleController matching the given path
	 * @param {String} [path] to module
	 * @return {ModuleController|null}
	 * @public
	 */
	getModuleController:function(path) {
		return this._getModuleControllers(path,true);
	},

	/**
	 * Returns an array of ModuleControllers matching the given path
	 * @param {String} [path] to module
	 * @return {Array}
	 * @public
	 */
	getModuleControllers:function(path) {
		return this._getModuleControllers(path);
	},

	/**
	 * Returns one or multiple ModuleControllers matching the supplied path
	 * @param {String} [path] - Optional path to match the nodes to
	 * @param {Boolean} [singleResult] - Optional boolean to only ask for one result
	 * @returns {Array|ModuleController|null}
	 * @private
	 */
	_getModuleControllers:function(path,singleResult) {

        // if no path supplied return all module controllers (or one if single result mode)
		if (typeof path === 'undefined') {
			if (singleResult) {
				return this._moduleControllers[0];
			}
			return this._moduleControllers.concat();
		}

        // loop over module controllers matching the path, if single result is enabled, return on first hit, else collect
		var i=0,l=this._moduleControllers.length,results=[],mc;
		for (;i<l;i++) {
			mc = this._moduleControllers[i];
			if (mc.matchesPath(path)) {
				if (singleResult) {
					return mc;
				}
				results.push(mc);
			}
		}
		return singleResult ? null : results;
	},

	/**
	 * Public method for safely attempting method execution on modules
	 * @param {String} method - method key
	 * @param {Array} [params] - array containing the method parameters
	 * @return [Array] returns object containing status code and possible response data
	 * @public
	 */
	execute:function(method,params) {

        var i=0,l=this._moduleControllers.length,controller,results = [];
        for (;i<l;i++) {
            controller = this._moduleControllers[i];
            results.push({
                controller:controller,
                result:controller.execute(method,params)
            });
        }
        return results;

	},

    /**
     * Called when module has loaded
     * @param moduleController
     * @private
     */
    _onModuleLoad:function(moduleController) {

        // listen to unload event so we can load another module if necessary
        Observer.unsubscribe(moduleController,'load',this._moduleLoadBind);
        Observer.subscribe(moduleController,'unload',this._moduleUnloadBind);

        // propagate events from the module controller to the node so people can subscribe to events on the node
        Observer.inform(moduleController,this);

        // publish event
        Observer.publish(this,'load',moduleController);

        // update initialized attribute
        this._updateInitialized();
    },

    /**
     * Called when module has unloaded
     * @param moduleController
     * @private
     */
    _onModuleUnload:function(moduleController) {

        // stop listening to unload
        Observer.subscribe(moduleController,'load',this._moduleLoadBind);
        Observer.unsubscribe(moduleController,'unload',this._moduleUnloadBind);

        // conceal events from module controller
        Observer.conceal(moduleController,this);

        // update initialized attribute
        this._updateInitialized();
    },

    /**
     * Updates the initialized attribute which contains a list of initialized modules
     * @private
     */
    _updateInitialized:function() {

        var i=0,controllers=this.getActiveModuleControllers(),l=controllers.length,modules=[];
        for(;i<l;i++) {
            modules.push(controllers[i].getModulePath());
        }

        if (modules.length) {
            this._element.setAttribute('data-initialized',modules.join(','));
        }
        else {
            this._element.removeAttribute('data-initialized');
        }

    }

};