/**
 * Created by Ralph Varjabedian on 11/11/14.
 * zoran is licensed under the [BSD-3 License] https://raw.githubusercontent.com/ralphv/zoran/master/LICENSE.
 * do not remove this notice.
 */
'use strict';

var data = {};
var fs = require("fs");
var functionGenerator = require("./lib/functionGenerator.js");
var path = require("path");
var config = require("./config.js");

function elapsed(startTime) {
  var diff = process.hrtime(startTime);
  return Math.round((diff[0] * 100000) + (diff[1] / 1e4)) / 100; // in milliseconds
}

var dirty = false;

process.on('SIGINT', function() {
  try {
    writeOutput(true);
  } catch(err) {
  }
  process.abort();
});

process.on('exit', function() {
  try {
    writeOutput(true);
  } catch(err) {
  }
});

function callReporters(data, engineData, sync) {
  for(var r = 0; r < config.reporters.length; r++) {
    var reporter = config.reporters[r];
    if(!reporter) {
      continue;
    }
    try {
      var callReporter = require("./reporters/" + reporter + "/", "__skip");
      callReporter(data, engineData, sync ? null : function() {});
    } catch(err) {
      console.zoran.log("reporter", reporter, "failed to run correctly", err);
    }
  }
}

function writeOutput(sync) {
  if(!dirty) {
    return;
  }
  dirty = false;

  if(sync) {
    console.zoran.log("writing result");
  }

  var totalCallsCount = 0;

  for(var i in data) {
    totalCallsCount += (data[i].async.count + data[i].sync.count);
  }

  if(!sync) {
    fs.writeFile(path.join(process.cwd(), "zoran.json"), JSON.stringify(data, null, 2), function() {
      console.zoran.log("results flushed, total calls", totalCallsCount);
      callReporters(data, {totalCalls: totalCallsCount, totalAttached: functionGenerator.getCount()}, sync);
    });
  } else {
    fs.writeFileSync(path.join(process.cwd(), "zoran.json"), JSON.stringify(data, null, 2));
    console.zoran.log("results written, total calls", totalCallsCount);
    callReporters(data, {totalCalls: totalCallsCount, totalAttached: functionGenerator.getCount()}, sync);
  }
}

var last_id = 0;
function resetTimer() {
  if(!config.flushEvery) {
    return;
  }
  clearTimeout(last_id);
  last_id = setTimeout(writeOutput, config.flushEvery); // flush
}

var handlers = module.exports = {
  reset: function() {
    data = {};
  },
  getData: function() {
    return data;
  },
  flush: function() {
    writeOutput(true);
  },
  getKey: function(proxyDefinition) {
    if(!proxyDefinition.more) {
      return proxyDefinition.name;
    }
    if(proxyDefinition.more.attachMonitor) {
      return proxyDefinition.name;
    } else {
      if(proxyDefinition.name) {
        return proxyDefinition.more.getId() + ":" + proxyDefinition.name;
      } else {
        return proxyDefinition.more.getId();
      }
    }
  },
  beforeFunc: function(proxyDefinition, instance, args, callInstance) {
    if(!proxyDefinition.name) {
      return;
    }
    var key = handlers.getKey(proxyDefinition);
    if(config.verbose >= 2) {
      console.zoran.log("before: ", key);
    }
    if(!data[key]) {
      data[key] = {
        async: {count: 0, total: 0}, sync: {count: 0, total: 0}
      };
    }
    callInstance.start = process.hrtime();
  },
  afterFunc: function(proxyDefinition, instance, args, callInstance, ret) {
    if(!callInstance.start) {
      return;
    }
    var key = handlers.getKey(proxyDefinition);
    if(config.verbose >= 2) {
      console.zoran.log("after: ", key);
    }
    var ms = elapsed(callInstance.start);
    var store = data[key];
    if (!store) {
      return;
    }
    if(callInstance.async) {
      store = store.async;
    } else {
      store = store.sync;
    }

    store.count++;
    store.total += ms;

    dirty = true;
    resetTimer();
  }
};