/**
 * Created by Ralph Varjabedian on 11/11/14.
 *
 * A utility that generates new functions but retains the parameters list of the original function and still supports closures correctly.
 * If you want to wrap or override functions and retain 100% compatibility you can not change the function signature.
 * You must keep the original signature (function parameters and their names)
 * Some advanced libraries have some logic that depends on this, for example dependency injection.
 *
 * Be Careful how you use it as the GC can't collect the functions created with this utility.
 *
 * zoran is licensed under the [BSD-3 License] https://raw.githubusercontent.com/ralphv/zoran/master/LICENSE.
 * do not remove this notice.
 */
'use strict';

var globalName = "___fake____closure";

if(!global[globalName]) {
  global[globalName] = [];
}
var closure = global[globalName];

var keepOldFunctionAsCommented = true; // some advanced classes use inner comments of functions for meta-data

var helper = require("./helper.js");
var assert = require("assert");

module.exports = {
  getCount: function() {
    return closure.length;
  },
  create: function(oldFunc, newFunction, signature) {
    closure.push(newFunction);
    var index = closure.length - 1;
    var argsList = helper.annotateFunction(oldFunc);
    var funcBody = "";
    if(signature) {
      funcBody += "//" + signature + "\r\n";
    }
    if(keepOldFunctionAsCommented) {
      var lines = oldFunc.toString().split("\n");
      for(var i = 0; i < lines.length; i++) {
        funcBody += "//" + lines[i] + "\r\n";
      }
      funcBody += "\r\n";
    }
    funcBody += "return global." + globalName + "[" + index + "].apply(this, arguments);";
    var newFuncToRet = new Function(argsList, funcBody);
    var newFuncToRetArgsList = helper.annotateFunction(newFuncToRet);
    assert(newFuncToRetArgsList.length === argsList.length);
    for(i = 0; i < newFuncToRetArgsList.length; i++) {
      assert(newFuncToRetArgsList[i] === argsList[i]);
    }
    return newFuncToRet;
  }
};
