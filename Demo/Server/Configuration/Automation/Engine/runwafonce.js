/*jslint node: true */
"use strict";

// this mimics the process that the daemon uses to spawn a workflow
// It is used by the debug tool "runw.bat", which resides in the /Workflows folder.

var workflow = process.argv[2];
var debug = process.argv[3];

if (workflow) {
   var child_process = require('child_process');

   var args = [];
   if (debug && debug === 'debug') {
      args.push('--debug-brk');
   }

   child_process.fork('workflow.js', process.argv /* modified from original to pass argv*/, {
         cwd: './' + workflow,
         execArgv: args
   });
}


