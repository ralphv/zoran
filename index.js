/**
 * Created by Ralph Varjabedian on 11/11/14.
 * zoran is licensed under the [BSD-3 License] https://raw.githubusercontent.com/ralphv/zoran/master/LICENSE.
 * do not remove this notice.
 */

console.zoran = {};

console.zoran.log = function() {
  console.log.apply(this, ["\033[1;34m[zoran]\033[0m"].concat(Array.prototype.slice.call(arguments, 0)));
};

console.zoran.warn = function() {
  console.warn.apply(this, ["\033[1;31m[zoran]\033[0m"].concat(Array.prototype.slice.call(arguments, 0)));
};

var config = require("./config.js");
var proxy = require("./lib/proxy.js");
var functionGenerator = require("./lib/functionGenerator.js");
var handlers = require("./handlers.js");
var path = require("path");
var requireHook = require("require-hook");

requireHook.setConfigSource(config); // use this projects config
requireHook.attach(path.resolve());

var last_id = 0;
function resetTimer() {
  clearTimeout(last_id);
  last_id = setTimeout(function() {
    console.zoran.log("total functions attached", functionGenerator.getCount());
  }, 5000);
}

function skipAttach(require) {
  if(config.skipAttach.length) {
    for(var i = 0; i < config.skipAttach.length; i++) {
      if(require.indexOf(config.skipAttach[i]) !== -1) {
        return true;
      }
    }
  }
  return false;
}

function includeAttach(require) {
  if(config.includeAttach.length) {
    for(var i = 0; i < config.includeAttach.length; i++) {
      if(require.indexOf(config.includeAttach[i]) !== -1) {
        return true;
      }
    }
  }
  return false;
}

requireHook.setEvent(function(requireResult, requireCallData) {
  if(requireCallData && requireResult) {
    if(includeAttach(requireCallData.require) || (
      (config.includeThirdParty || !requireCallData.thirdParty) && !requireCallData.testOnly && !requireCallData.native && !requireCallData.json &&
      requireCallData.localToProject &&
      requireCallData.getId())) {
      if(requireResult.prototype && typeof(requireResult) === "function") { // is a function
        if(!skipAttach(requireCallData.getId())) {
          var count = functionGenerator.getCount();
          if(Object.keys(requireResult.prototype).length > 0) { // meant as a class constructor
            proxy.createPrototypeProxy(requireResult.prototype, handlers.beforeFunc, handlers.afterFunc, requireCallData);
          } else { // meant as function
            if(config.attachRequireResultIfFunction) {
              requireResult = proxy.createProxy(requireResult, handlers.beforeFunc, handlers.afterFunc, requireCallData);
            }
          }
          console.zoran.log("attaching on prototype", requireCallData.getId(), functionGenerator.getCount() - count);
        } else {
          if(config.verbose >= 1) {
            console.zoran.log("skipping", requireCallData.getId());
          }
        }
      } else if(!requireResult.prototype && requireResult.constructor === Object && requireResult !== zoran) { // is a generic instance of Object
        if(!skipAttach(requireCallData.getId())) {
          var count = functionGenerator.getCount();
          proxy.createPrototypeProxy(requireResult, handlers.beforeFunc, handlers.afterFunc, requireCallData);
          console.zoran.log("attaching on object", requireCallData.getId(), functionGenerator.getCount() - count);
        } else {
          if(config.verbose >= 1) {
            console.zoran.log("skipping", requireCallData.getId());
          }
        }
      }
    } else if(config.verbose >= 1) {
      console.zoran.log("skipping", requireCallData.require);
    }
    resetTimer();
  }
  return requireResult;
});

/**
 * The main interface to the library zoran
 *
 * @exports zoran
 * @type {{attachMonitor: attachMonitor, begin: begin, end: end}}
 */
var zoran = {
  /**
   * Manually attach a monitor to a single function
   *
   * @param {function} func the function reference to monitor
   * @param {string} name the name of the function, this will be the main identifier in the statistics produced
   * @returns {function} the new function reference that should replace the passed in reference
   */
  attachMonitor: function(func, name) {
    return proxy.createProxy(func, handlers.beforeFunc, handlers.afterFunc, {attachMonitor: true}, name);
  },
  /**
   * Manually call at the beginning of a certain operation you want to measure
   *
   * @param {string} name this will be the main identifier in the statistics produced
   * @param {array} args arguments of arguments
   * @returns {{}} the callInstance object, you must pass this to the matching end function
   */
  begin: function(name, args) {
    var callInstance = {name: name};
    handlers.beforeFunc({name: name}, null, args, callInstance);
    return callInstance;
  },
  /**
   * Manually call at the end of a certain operation you want to measure
   *
   * @param {array} args args arguments of arguments
   * @param callInstance the return value you got from begin function must be passed here
   */
  end: function(args, callInstance) {
    handlers.afterFunc({name: callInstance.name}, null, args, callInstance);
  },
  /**
   * Returns the reference to the data object that has the collected data
   *
   * @returns {{}}}
   */
  getData: function() {
    return handlers.getData();
  },
  /**
   * resets the collected data
   */
  reset: function() {
    handlers.reset();
  },
  /**
   * returns the total number of functions hooked for performance evaluation
   *
   * @returns {numeric}
   */
  getFunctionsCount: function() {
    return functionGenerator.getCount();
  },
  /**
   * flush log file(s)
   */
  flush: function() {
    handlers.flush();
  }
};
module.exports = zoran;