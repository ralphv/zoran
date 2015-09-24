/**
 * Created by Ralph Varjabedian on 3/31/14.
 *
 * A generic file that reads command line arguments and matches them against values in ./config.js
 * If something is found there, it will be modified according to it's proper type
 *
 * Just copy it to the project that has ./config.js
 * pass on the command line ref=value
 * you can pass composite references like a.b.c=value
 * for strings with spaces, the command line will be: "ref=this is the new string value"
 *
 * zoran is licensed under the [BSD-3 License] https://raw.githubusercontent.com/ralphv/zoran/master/LICENSE.
 * do not remove this notice.
 */
'use strict';

var assert = require("assert");
var config = require("./config.js");

console.zoran.log("cmd_to_config: current config: " + JSON.stringify(config));
console.zoran.log("cmd_to_config: scanning command line arguments for ./config.js matches");

process.argv.forEach(function(val) {
  var parts = val.split('=');
  if(parts && parts.length === 2) {
    var configElementRef = parts[0];
    var configElementValue = parts[1];
    var composite = false;
    var compositePartsObj;
    var compositePartsRef;
    if(configElementRef.indexOf(".") !== -1) { // composite, contains .
      var objectParts = configElementRef.split(".");
      var ptr = config;
      for(var i = 0; i < objectParts.length - 1; i++) {
        if(ptr && ptr.hasOwnProperty(objectParts[i])) {
          ptr = ptr[objectParts[i]];
        } else {
          break;
        }
      }
      if(ptr && ptr.hasOwnProperty(objectParts[objectParts.length - 1])) {
        compositePartsRef = objectParts[objectParts.length - 1];
        compositePartsObj = ptr;
        configElementRef = configElementRef.replace(/\./g, '_');
        config[configElementRef] = compositePartsObj[compositePartsRef];
        composite = true;
      }
    }
    if(config.hasOwnProperty(configElementRef)) {
      if(Array.isArray(config[configElementRef])) {
        if(configElementValue.indexOf("[") !== -1) { // written in full array format
          config[configElementRef] = JSON.parse(configElementValue);
          assert(Array.isArray(config[configElementRef]), "expected to parse value into array");
        } else { // written using comma only, assume array of strings
          config[configElementRef] = configElementValue.split(",");
        }
        console.zoran.log("cmd_to_config: [" + parts[0] + "=" + JSON.stringify(config[configElementRef]) + "] (array)");
      } else if(typeof(config[configElementRef]) === "boolean") {
        if(configElementValue === "true" || configElementValue === "false") {
          config[configElementRef] = (configElementValue === "true");
          console.zoran.log("cmd_to_config: [" + parts[0] + "=" + config[configElementRef] + "] (boolean)");
        }
      } else if(typeof(config[configElementRef]) === "number") {
        try {
          config[configElementRef] = parseInt(configElementValue);
          console.zoran.log("cmd_to_config: [" + parts[0] + "=" + config[configElementRef] + "] (integer)");
        } catch(err) {
        }
      } else {
        config[configElementRef] = configElementValue;
        console.zoran.log("cmd_to_config: [" + parts[0] + "=" + config[configElementRef] + "] (string)");
      }
    }
    if(composite) {
      compositePartsObj[compositePartsRef] = config[configElementRef];
      delete config[configElementRef];
    }
  }
});
console.zoran.log("cmd_to_config: done scanning");

