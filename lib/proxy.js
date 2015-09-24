/**
 * Written by Ralph Varjabedian.
 * http://www.codeproject.com/Articles/666289/Proxy-pattern-in-JavaScript
 * 1.22
 *
 * zoran is licensed under the [BSD-3 License] https://raw.githubusercontent.com/ralphv/zoran/master/LICENSE.
 * do not remove this notice.
 */
'use strict';

var functionGenerator = require("./functionGenerator.js");
var helper = require("./helper.js");
var config = require("../config.js");
var proxySignature = "[proxy_signature_##$#!1234]";
var maxLevelsForCircularStructure = 10;

function getElementId() {
  return (this.more && this.more.getId) ? this.more.getId() : this.name;
}

function createProxy(func, beforeFunc, afterFunc, more, e) {
  if(func.toString().indexOf(proxySignature) !== -1) {  // already proxied
    return func;
  }
  var proxyInstanceDefinition = {};
  proxyInstanceDefinition.func = func;
  proxyInstanceDefinition.beforeFunc = beforeFunc;
  proxyInstanceDefinition.afterFunc = afterFunc;
  proxyInstanceDefinition.more = more;
  proxyInstanceDefinition.name = e ? e : func.name;
  proxyInstanceDefinition.getId = getElementId;
  var newFunc = __createProxy(proxyInstanceDefinition);
  helper.copyProperties(func, newFunc);
  newFunc.prototype = func.prototype;
  return newFunc;
}

function createPrototypeProxy(obj, beforeFunc, afterFunc, more, prefix, levels) {
  if(levels !== -1) {
    if(levels === 0) {
      return;
    }
    levels--;
  }
  if(!prefix) {
    prefix = "";
  }
  try {
    for(var e in obj) {
      if(obj.hasOwnProperty(e) && typeof(obj[e]) === "function") {
        if(Object.keys(obj[e].prototype).length > 0) { // meant as a class constructor
          createPrototypeProxy(obj[e].prototype, beforeFunc, afterFunc, more, prefix + e + ".", levels);
        } else { // meant as a function
          obj[e] = createProxy(obj[e], beforeFunc, afterFunc, more, prefix + e);
        }
      } else if(obj.hasOwnProperty(e) && typeof(obj[e]) === "object") {
        createPrototypeProxy(obj[e], beforeFunc, afterFunc, more, prefix + e + ".", levels);
      }
    }
  } catch(err) {
  }
}

var safeCallerList = ["module.js"];
function getCallerInfo() {
  var _prepareStackTrace = Error.prepareStackTrace;
  try {
    Error.prepareStackTrace = function(err, stack) { return stack; };
    var err = new Error();
    var currentFile = err.stack.shift().getFileName();
    while(err.stack.length) {
      var e = err.stack.shift();
      var callerFile = e.getFileName();
      if(callerFile && callerFile != currentFile && safeCallerList.indexOf(callerFile) === -1) {
        return {location: callerFile, lineNumber: e.getLineNumber()};
      }
    }
  } catch(err) {
  } finally {
    Error.prepareStackTrace = _prepareStackTrace;
  }
  return null;
}

function callAsync(This, args, proxyInstanceDefinition) {
  var callInstance = {callerInfo: getCallerInfo(), async: true};
  var oldCb = args[args.length - 1];
  args[args.length - 1] = function() {
    if(proxyInstanceDefinition.afterFunc) {
      proxyInstanceDefinition.afterFunc(proxyInstanceDefinition, this, arguments, callInstance);
    }
    return oldCb.apply(this, arguments);
  };
  if(proxyInstanceDefinition.beforeFunc) {
    proxyInstanceDefinition.beforeFunc(proxyInstanceDefinition, This, args, callInstance);
  }
  return proxyInstanceDefinition.func.apply(This, args);
}

function callSync(This, args, proxyInstanceDefinition) {
  var callInstance = {callerInfo: getCallerInfo(), async: false};
  if(proxyInstanceDefinition.beforeFunc) {
    proxyInstanceDefinition.beforeFunc(proxyInstanceDefinition, This, args, callInstance);
  }
  var ret = proxyInstanceDefinition.func.apply(This, args);
  if(proxyInstanceDefinition.afterFunc) {
    proxyInstanceDefinition.afterFunc(proxyInstanceDefinition, This, args, callInstance, ret);
  }
  return ret;
}

function isAsyncCall(lastArgument, lastParameter, proxyInstanceDefinition) {
  // the detection of async calls is a tricky business, you can't just assume if last parameter is a function then it is always a callback.
  // it maybe a constructor, or a utility function...
  // safe mode which is on by default will check the parameter names of the function as well.
  var isFunction = (typeof(lastArgument) === "function") && (Object.keys(lastArgument.prototype).length === 0);
  var isNameMatches = lastParameter && config.callbackNames.indexOf(lastParameter.toLowerCase()) !== -1;
  if(config.safeAsyncDetection) {
    if(isFunction && !isNameMatches && lastParameter && config.ignoreCallbackNames.indexOf(lastParameter.toLowerCase()) === -1 && config.verbose >= 1) {
      console.zoran.warn("possible callback function detected,", "@" + proxyInstanceDefinition.getId(), "but parameter name didn't pass:", lastParameter);
    }
    return isFunction && isNameMatches;
  } else {
    return isFunction;
  }
}

function __createProxy(proxyInstanceDefinition) {
  if(typeof(proxyInstanceDefinition.func) !== "function") {
    throw new Error("func not a function");
  }
  proxyInstanceDefinition.array = helper.annotateFunction(proxyInstanceDefinition.func);
  var newFunc = functionGenerator.create(proxyInstanceDefinition.func, function() {
    if(isAsyncCall(arguments[arguments.length - 1], proxyInstanceDefinition.array.length > 0 ? proxyInstanceDefinition.array[proxyInstanceDefinition.array.length - 1] : null, proxyInstanceDefinition)) {
      return callAsync(this, arguments, proxyInstanceDefinition);
    } else {
      return callSync(this, arguments, proxyInstanceDefinition);
    }
  }, proxySignature);
  if(config.verbose >= 3) {
    console.log("overriding the following function:", proxyInstanceDefinition.func.toString(), "\r\nwith the following", newFunc);
  }
  return newFunc;
}

module.exports = {
  createProxy: createProxy,
  createPrototypeProxy: function(obj, beforeFunc, afterFunc, more, prefix) {
    var circularStructure = false;
    try {
      JSON.stringify(obj);
    } catch(err) {
      console.zoran.warn("circular structure detected, limiting levels to:", maxLevelsForCircularStructure);
      circularStructure = true;
    }
    return createPrototypeProxy(obj, beforeFunc, afterFunc, more, prefix, circularStructure ? maxLevelsForCircularStructure : -1);
  }
};
