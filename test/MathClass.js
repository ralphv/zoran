/**
 * Created by Ralph Varjabedian on 11/14/14.
 */

function MathHelperClass() {
}

MathHelperClass.prototype = {
  doFormula : function(a, b) {
    return (a + b + 2) * a;
  }
};

function MathClass() {
}

MathClass.prototype = {
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
    this.sub.sampleSub();
    cb(a - b);
  },
  sub: {
    sampleSub: function() {
    }
  },
  MathHelperClass: MathHelperClass
};

module.exports = MathClass;


