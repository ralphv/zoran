/**
 * Created by Ralph Varjabedian on 11/12/14.
 * node.profiler is licensed under the [BSD-3 License] http://bitbucket.com/ralphv/node.profiler/raw/master/LICENSE.
 * do not remove this notice.
 */

module.exports = {
  verbose: 0,
  alternateProjectPaths: [],
  skipAttach: [],
  includeAttach: [],
  projectsRoot: "",
  testOnlySubPath: ["test", "e2e"],
  flushEvery: 10000,
  includeThirdParty: false,
  runGrunt: "",
  reporters: ["high-charts"],
  callbackNames: ["cb", "done", "next", "callback"],
  ignoreCallbackNames: ["failurefn", "connect"],
  safeAsyncDetection: true,
  attachRequireResultIfFunction: true
};
