#!/usr/bin/env node
/*
 * zoran is licensed under the [BSD-3 License] https://raw.githubusercontent.com/ralphv/zoran/master/LICENSE.
 * do not remove this notice.
 */
'use strict';

var path = require("path");
var zoran = require("./index.js");
require("./cmd_to_config.js");
var config = require("./config.js");

if(config.runGrunt) { // a special option to run a grunt task instead
  var grunt = require("grunt");
  grunt.tasks([config.runGrunt], {}, function() {
    zoran.flush();
    process.exit();
  });
} else {
  // resolve and require to run target project
  var p = ".";
  if(process.argv.length >= 3) {
    p = process.argv[2];
    if(!p || p.indexOf("=") !== -1) { // meant as a config parameter
      p = ".";
    }
  }
  if(p.indexOf(path.sep) !== 0) {
    p = path.normalize(path.join(process.cwd(), p));
    p = require.resolve(p);
  }
  require(p); // run target library
}