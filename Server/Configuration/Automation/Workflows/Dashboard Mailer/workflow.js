/*

The following three lines are standard JavaScript headers.
They should always be present; they allow 'JsLint' to check the code.

*/

/*jslint node: true */
/*jslint plusplus: true */ 
"use strict";

const penv = require('../../Engine/prognosis-env'),
      profiles = require('../../../../../WebUI/IIS/Administration/Config/dashboardmailer.json'),
      config = require('./config.json'),
      maxtimeoutinmin = config.maxtimeoutinmin || 10;

const cCapture = require('./capture.js');
const cMailer = require('./mailer.js');
const cFileHandler = require('./file-handler.js');

var creds = penv.getCredentials('dashboard-mailer');
creds.user = creds.user || config.creds.user;
creds.password = creds.password || config.creds.password;

if (!creds.user && !creds.password) {
   console.log ('Cannot retrieve password for "AUTOMATION:dashboard-mailer" entry, verify it exists');
   return;
} else {
   console.log (`got credentials, user: ${creds.user}, password: *******`);
}

var dash_profile = process.argv[5],
    dashboards,
    email;
    
if (dash_profile && profiles.dashboard_profiles[dash_profile]) {
   dashboards = profiles.dashboard_profiles[dash_profile].dashboards;
   email = profiles.dashboard_profiles[dash_profile].email;
}

if (!dashboards && !email) {
   console.log ('Cannot retrieve dashboard profile "' + dash_profile + '"');
   return;
}
console.log (`Initilizing: profile: ${dash_profile}
             email: ${email}
             smpt server: ${profiles.mail_server}`);

async function run() {
   const capture = new cCapture(dash_profile, creds);
   await capture.setup();
   try {
      let data = await capture.captureDashboards();
      data.email = email;  //to email
      data.subject = (config.subjectprefix || 'Snapshot - ') + dash_profile;
      const mailer = new cMailer();
      console.log (`Sending email ...`);
      await mailer.sendMail(data);
      const filehandler = new cFileHandler();
      await filehandler.deleteFiles(data.screenshots);
      await filehandler.deleteFiles(data.spreadsheets);
   } catch (err) {
      console.log (`Error occured, error: ${JSON.stringify(err, null, '   ')}`);
   }
   capture.closeBrowser();
   process.exit(1);
}

run();

setTimeout( (function() {
   console.log ('Maximum timeout of ' + maxtimeoutinmin + ' min reached, process would exit now.');
   return process.exit(1);
}), maxtimeoutinmin * 60 * 1000);
