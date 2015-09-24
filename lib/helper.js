/**
 * Created by Ralph Varjabedian on 11/11/14.
 * zoran is licensed under the [BSD-3 License] https://raw.githubusercontent.com/ralphv/zoran/master/LICENSE.
 * do not remove this notice.
 */
'use strict';

/* annotate */
var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function annotateFunction(fn) {
  var array = [];
  var fnText = fn.toString().replace(STRIP_COMMENTS, '');
  var argDecl = fnText.match(FN_ARGS);
  var arg = argDecl[1].split(FN_ARG_SPLIT);
  for(var x = 0; x < arg.length; x++) {
    (function(arg) {
      arg.replace(FN_ARG, function(all, underscore, name) {
        array.push(name);
      });
    })(arg[x]);
  }
  return array;
}
/* annotate */

module.exports = {
  annotateFunction: annotateFunction,
  copyProperties: function(src, dst) {
    for(var prop in src) {
      if(src.hasOwnProperty(prop)) {
        dst[prop] = src[prop];
      }
    }
  }
};
