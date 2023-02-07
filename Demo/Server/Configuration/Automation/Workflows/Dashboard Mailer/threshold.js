/*

The following three lines are standard JavaScript headers.
They should always be present; they allow 'JsLint' to check the code.

*/

/*jslint node: true */
/*jslint plusplus: true */ 
"use strict";

var exports = module.exports = {},
    fs = require('fs'),
    filename = 'scheduler-threshold.txt';
var spawn = require('child_process').spawn;

var th_template = `START
THRESHOLD "Dashboard-Mailer"
   NODE (
      NODE "#CurrentNode"
      END_NODE 
   )    
   CONDITION (
      __INSERT_CONDITIONS_HERE__
   )
END_THRESHOLD`;

var th_condition_template = `THRESHOLD_CONDITION "__PROFILE_NAME__"
         ACTION (
            ACTION 
               LOG_TYPE               COMMAND
               SEVERITY               WARNING
               ON_EVENT_NUM           0
               EVENT_TYPE             ON_EVENT
               LOG_TEXT               "cd Automation/Workflows && runwa.bat \\"Dashboard Mailer\\" \\"__PROFILE_NAME__\\" > \\"..\\\\..\\\\irdashboardmailer __PROFILE_NAME__.log\\""
               OFF_EVENT_NUM          0
               OFF_TEXT               ""
               USER                   "PROGNOSIS"
               COMMAND_TYPE           SHELL
               SHELL_SHARING          DEFAULT
            END_ACTION 
         )      
         VIEW 
            RECORD           "PNODES"
            INTERVAL         1 MINUTES
            NODE             (
               NODE #CurrentNode
               END_NODE 
            )                
            WHERE            (
               ALL              
            )                
         END_VIEW         
         AFTER 1 OCCURRENCES
         LOGEVERY 1 HOURS
         __DAYS_OF_WEEK__
         BETWEEN __HOUR_OF_THE_DAY__
         OFF_TEXT ""
         OFF_EVENT_NUM 0
      END_THRESHOLD_CONDITION 
      `;
      

function getConditionText(profilename, profile){
   var cond = th_condition_template.replace(/__PROFILE_NAME__/g,profilename),
       hourfrequency = profile.hourfrequency,
       dayofweek     = profile.dayofweek,
       timeofday     = profile.timeofday;
   if (dayofweek == "EVERY"){  //Hourly is selected
      cond = cond.replace(/\n\s*__DAYS_OF_WEEK__\n\s*BETWEEN __HOUR_OF_THE_DAY__/,'');
      cond = cond.replace(/INTERVAL         1 MINUTES/,'INTERVAL         ' + hourfrequency + ' HOURS');
   } else if (dayofweek == "DAY"){  //Daily is selected
      cond = cond.replace(/__HOUR_OF_THE_DAY__/,timeofday);
      cond = cond.replace(/\n\s*__DAYS_OF_WEEK__/,'');
   } else if (dayofweek == "WEEKDAYS"){  //Weekdays is selected
      cond = cond.replace(/__HOUR_OF_THE_DAY__/,timeofday);
      cond = cond.replace(/__DAYS_OF_WEEK__/,'DAYS_OF_WEEK ( MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY )');
   } else { //One day of week and time of day is selected.
      cond = cond.replace(/__HOUR_OF_THE_DAY__/,timeofday);
      cond = cond.replace(/__DAYS_OF_WEEK__/,'DAYS_OF_WEEK ( ' + dayofweek + ' )');
   }
   
   
   return cond;
}
      
exports.updateScheduler = function (wf, json, callback) {
   wf.logOutput(`Scheduling profiles ...`);
   
   var txt = th_template,
       conds = '';
   for (var profilename in json.dashboard_profiles) {
      conds += getConditionText(profilename, json.dashboard_profiles[profilename]);
   }
   txt = th_template.replace(/__INSERT_CONDITIONS_HERE__/,conds);
   fs.writeFileSync(filename, txt);
   
   wf.logOutput(`Starting threshold ...`);
   var cmd = spawn('cmd.exe', ['/c', 'scheduler.bat']);
   
   cmd.stdout.on('data', function (data) {
      wf.logOutput(`${data}`);
   });
   cmd.stderr.on('data', function (data) {
      wf.logOutput(`error: ${data}`);
      var s = data.toString();
   });

   cmd.on('exit', (code) => {
      wf.logOutput(`Scheduling completed`);
      callback();
   }); 
}
