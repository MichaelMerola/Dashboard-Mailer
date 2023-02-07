/*
EDITED DEMO VERSION OF DASHBOARD-MAILER WORKFLOW
--------------------------------------------------
NOT FOR CUSTOMER USE!


The following three lines are standard JavaScript headers.
They should always be present; they allow 'JsLint' to check the code.

*/

/*jslint node: true */
/*jslint plusplus: true */ 
"use strict";

const config = require('./config.json'),
      maxtimeoutinmin = config.maxtimeoutinmin || 10;

const cMailer = require('./mailer.js');

var wf = require('../../Engine/workflow_lib'),
    th = require('./threshold');

// get path to demo xl and screenshots from config.json
const demodata = config.demodata; 

// get dashboard profiles like usual
var dash_profile = process.argv[5],
    email = config.dashboard_profiles[dash_profile].email;

if (!email) {
   console.log ('Cannot retrieve email profile "' + dash_profile + '"');
   return;
}
console.log (`Initilizing: profile: ${dash_profile}
             email: ${email}
             smpt server: ${config.mail_server}`);

// send email with demo data
async function run() {
   try {
      let data = demodata;
      data.email = email; //to email
      data.subject = (config.subjectprefix || 'Snapshot - ') + dash_profile;
      const mailer = new cMailer();
      console.log (`Sending email ...`);
      await mailer.sendMail(data);
   } catch (err) {
      console.log (`Error occured, error: ${JSON.stringify(err, null, '   ')}`);
   }
   process.exit(1);
}

run();

setTimeout( (function() {
   console.log ('Maximum timeout of ' + maxtimeoutinmin + ' min reached, process would exit now.');
   return process.exit(1);
}), maxtimeoutinmin * 60 * 1000);


// update threshold scheduler			
th.updateScheduler(wf, config, () => {
      wf.logOutput(`Saved profiles to disk`);
      wf.logOutput(`Dashboard Mailer Configuration Completed`);
      console.log (`Updating Threshold Schedule`);
});
