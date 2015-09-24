/**
 * Created by Ralph Varjabedian on 11/16/14.
 * zoran is licensed under the [BSD-3 License] https://raw.githubusercontent.com/ralphv/zoran/master/LICENSE.
 * do not remove this notice.
 */

var fs = require("fs");
var path = require("path");
var config = require("../../config.js");


function modifyTemplate(template, data, pageTitle, title) {
  return template.replace(/\[TEMPLATE.DATA\]/g, JSON.stringify(data, null, 2)).replace(/\[TEMPLATE.PAGETITLE\]/g, pageTitle).replace(/\[TEMPLATE.TITLE\]/g, title);
}

function processCommonProjectsRoot(root, p) {
  if(!root || !p || p.indexOf(path.sep) === -1) {
    return root;
  }
  while(root && p.indexOf(root + path.sep) !== 0) {
    root = root.substring(0, root.lastIndexOf(path.sep));
  }
  return root;
}

module.exports = function(data, engineData, cb) {
  var highcharts = [];
  var max = 0;
  var projectsRoot = config.projectsRoot;

  if(!projectsRoot) {
    projectsRoot = process.cwd();
  }

  // find max and try to locate a higher level projectsRoot
  for(var i in data) {
    var value = data[i];
    projectsRoot = processCommonProjectsRoot(projectsRoot, i);
    value = (value.async.total / value.async.count) + (value.sync.total / value.sync.count);
    if(value > max) {
      max = value;
    }
  }

  if(projectsRoot && projectsRoot[projectsRoot.length - 1] !== path.sep) {
    projectsRoot += path.sep;
  }

  // push anything above 1% into the high charts data array
  for(i in data) {
    value = data[i];
    if(value.async.count > 0) {
      value = value.async.total / value.async.count;
    } else {
      value = value.sync.total / value.sync.count;
    }
    if(value / max > 0.01) { // > 1%
      var name = i;
      if(projectsRoot && name.indexOf(projectsRoot) === 0) {
        name = "./" + name.substring(projectsRoot.length);
      }
      highcharts.push({name: name, y: value, tpc: value, sync: data[i].sync, async: data[i].async});
    }
  }

  try {
    fs.mkdirSync(path.join(process.cwd(), "reports"));
  } catch(err) {
  }

  var title = "<a href='https://www.npmjs.org/package/zoran'>zoran</a> high-charts total calls (" + engineData.totalCalls + ") total attached (" + engineData.totalAttached + ")";

  if(cb) {
    fs.readFile(path.join(__dirname, "template.html"), "utf8", function(err, template) {
      template = modifyTemplate(template, highcharts, "zoran high-charts", JSON.stringify(title));
      fs.writeFile(path.join(process.cwd(), "reports", "high-charts.html"), template, function() {
        console.zoran.log("created ./reports/high-charts.html");
        cb();
      });
    });
  } else {
    var template = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
    template = modifyTemplate(template, highcharts, "zoran high-charts", JSON.stringify(title));
    fs.writeFileSync(path.join(process.cwd(), "reports", "high-charts.html"), template);
    console.zoran.log("created ./reports/high-charts.html");
  }
};
