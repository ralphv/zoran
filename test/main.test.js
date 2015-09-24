/**
 * Created by Ralph Varjabedian on 11/14/14.
 */

'use strict';

var should = require('should');
var path = require('path');

describe('testing node.profiler', function() {
  this.timeout(0);

  it('testing require and hook', function(done) {
    var Module = require("module");
    var oldRequire = Module.prototype.require;
    should.not.exist(global.moduleRequire);
    require("../");
    Module.prototype.require.should.not.equal(oldRequire);
    var config = require("../config.js");
    config.testOnlySubPath = []; // remove it, we need the hook to attach to all files in test mode
    config.alternateProjectPaths = ["/anything"];
    done();
  });

  it('testing attachMonitor on sync function', function(done) {
    var node_profiler = require("../");
    node_profiler.reset();
    var func = function(a, b) {
      return a + b;
    };
    try {
      node_profiler.attachMonitor({}, "not-a-function");
    } catch(err) {
      should.exist(err);
    }
    func = node_profiler.attachMonitor(func, "sync");
    func = node_profiler.attachMonitor(func, "sync"); // test if already hooked test passes
    func(10, 12);
    var data = node_profiler.getData();
    should.exist(data.sync);
    should.equal(data.sync.async.count, 0);
    should.equal(data.sync.sync.count, 1);
    done();
  });

  it('testing attachMonitor on ASync function', function(done) {
    var node_profiler = require("../");
    node_profiler.reset();
    var func = function(a, b, cb) {
      cb(a + b);
    };
    func = node_profiler.attachMonitor(func, "async");
    func(10, 12, function() {
      var data = node_profiler.getData();
      should.exist(data.async);
      should.equal(data.async.async.count, 1);
      should.equal(data.async.sync.count, 0);
      done();
    });
  });

  it('testing begin/end', function(done) {
    var node_profiler = require("../");
    node_profiler.reset();
    var func = function(a, b) {
      var callInstance = node_profiler.begin("sync", arguments);
      var x = a + b;
      node_profiler.end(arguments, callInstance);
      return x;
    };
    func(10, 12);
    var data = node_profiler.getData();
    should.exist(data.sync);
    should.equal(data.sync.async.count, 0);
    should.equal(data.sync.sync.count, 1);
    done();
  });

  it('testing auto attach on require prototype', function(done) {
    var node_profiler = require("../");
    node_profiler.reset();
    var count = node_profiler.getFunctionsCount();
    var MathClass = require("./MathClass");
    require("./MathClass"); // require again
    var keyPrefix = __dirname + "/MathClass.js:";
    should.equal(node_profiler.getFunctionsCount(), count + 6);
    var data = node_profiler.getData();
    should.exist(data);
    var math = new MathClass();
    math.add(10, 12);
    should.exist(data[keyPrefix + "add"]);
    should.equal(data[keyPrefix + "add"].sync.count, 1);
    math.add(15, 13);
    should.equal(data[keyPrefix + "add"].sync.count, 2);
    math.subtract(15, 13);
    should.equal(data[keyPrefix + "subtract"].sync.count, 1);
    var mathHelperClass = new math.MathHelperClass();
    mathHelperClass.doFormula(1, 2);
    should.equal(data[keyPrefix + "MathHelperClass.doFormula"].sync.count, 1);
    math.addAsync(15, 13, function() {
      should.equal(data[keyPrefix + "addAsync"].async.count, 1);
      math.subtractAsync(15, 13, function() {
        should.equal(data[keyPrefix + "subtractAsync"].async.count, 1);
        should.equal(data[keyPrefix + "sub.sampleSub"].sync.count, 1);
        done();
      });
    });
  });

  it('testing auto attach on require object', function(done) {
    var node_profiler = require("../");
    node_profiler.reset();
    var count = node_profiler.getFunctionsCount();
    var math = require(path.join(__dirname, "mathHelper.js"));
    var keyPrefix = __dirname + "/mathHelper.js:";
    should.equal(node_profiler.getFunctionsCount(), count + 5);
    var data = node_profiler.getData();
    should.exist(data);
    math.add(10, 12);
    should.exist(data[keyPrefix + "add"]);
    should.equal(data[keyPrefix + "add"].sync.count, 1);
    math.add(15, 13);
    should.equal(data[keyPrefix + "add"].sync.count, 2);
    math.subtract(15, 13);
    should.equal(data[keyPrefix + "subtract"].sync.count, 1);
    math.addAsync(15, 13, function() {
      should.equal(data[keyPrefix + "addAsync"].async.count, 1);
      math.subtractAsync(15, 13, function() {
        should.equal(data[keyPrefix + "subtractAsync"].async.count, 1);
        done();
      });
    });
  });

  it('testing correct metrics', function(done) {
    var node_profiler = require("../");
    node_profiler.reset();
    var math = require("./mathHelper.js");
    var keyPrefix = __dirname + "/mathHelper.js:";
    var data = node_profiler.getData();
    math.sleep(100, function() {
      (data[keyPrefix + "sleep"].async.total).should.be.within(98, 110);
      math.sleep(200, function() {
        (data[keyPrefix + "sleep"].async.total).should.be.within(297, 330);
        done();
      });
    });
  });

});

