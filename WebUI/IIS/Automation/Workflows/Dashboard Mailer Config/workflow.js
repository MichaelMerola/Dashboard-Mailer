/*

The following three lines are standard JavaScript headers.
They should always be present; they allow 'JsLint' to check the code.

*/

/*jslint node: true */
/*jslint plusplus: true */ 
"use strict";

// Load the workflow library
var wf = require('../../Engine/workflow_lib'),
    th = require('./threshold');

// Update the workflow status displayed in Prognosis
wf.updateStatus(wf.status.inProgress);
// wf.restartOnCrash(true);

var fs = require('fs'),
    instance = JSON.parse(fs.readFileSync('instance.json')),
    filename = '../../../../../WebUI/IIS/Administration/Config/dashboardmailer.json',
    mailerjson = JSON.parse(fs.readFileSync(filename)),
    profile = instance.parameters.profile,
    // json = JSON.parse(instance.parameters.mailerjson.replace(/_\^amp\^_/g,'&')); //String instance.parameters.json needs to be converted into JSON
    json = JSON.parse(instance.parameters.mailerjson);
    
mailerjson.mail_server  = json.mail_server || 'localhost';
mailerjson.mail_from    = json.mail_from || 'Prognosis Automated Snapshot <snapshot@ir.com>';
mailerjson.save_to      = json.save_to || '<Prognosis Node Name>';
mailerjson.dashboard_profiles = json.dashboard_profiles || {};

th.updateScheduler(wf, mailerjson, () => {
   fs.writeFile(filename, JSON.stringify(mailerjson, null, "   "), (err) => {
      wf.logOutput(`Saved profiles to disk`);
      wf.logOutput(`Dashboard Mailer Configuration Completed`);
      wf.updateStatus(wf.status.completedOK);
   });
});


