/**
 * Created by Ralph Varjabedian on 11/14/14.
 */

module.exports = {
  add: function(a, b) {
    return a + b;
  },
  subtract: function(a, b) {
    return a - b;
  },
  addAsync: function(a, b, cb) {
    cb(a + b);
  },
  subtractAsync: function(a, b, cb) {
    cb(a - b);
  },
  sleep: function(milliSec, cb) {
    setTimeout(cb, milliSec);
  }
};