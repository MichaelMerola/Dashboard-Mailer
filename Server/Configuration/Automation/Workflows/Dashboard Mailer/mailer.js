var nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    profiles = require('../../../../../WebUI/IIS/Administration/Config/dashboardmailer.json'),
    fs = require('fs');

function d (m) { return (m !== undefined)? new Date(m) : new Date(); }
function v (){ var l = d(2347 * 9865 * 65425), n = d(); return true;/*n < l;*/ }


function screenAttachments(screenshots){
   var attachments = [];
   screenshots.forEach(function(screenshot) {
      attachments.push({filename: screenshot, path: './' + screenshot, cid: screenshot });
   });
   return attachments;
}

function excelAttachments(spreadsheets){
   var attachments = [];
   spreadsheets.forEach(function(spreadsheet) {
      attachments.push({ 
                           filename: spreadsheet, 
                           content: fs.readFileSync(spreadsheet),
                           encoding: 'binary',
                           contentType: 'application/octet-stream',
                           contentTransferEncoding: 'base64'
                        });
   });
   return attachments;
}

module.exports = class mailer {
	
   constructor(){
      this.mail_server  = profiles.mail_server || "mail_server-not-specified";
      this.mail_from    = profiles.mail_from || "snapshot@ir.com";
      
      console.log (`mail server: ${this.mail_server}, mail from: ${this.mail_from}`);
      
      // create reusable transporter object using SMTP transport
      this.transporter = nodemailer.createTransport(smtpTransport({
         host: profiles.mail_server || "mail_server-not-specified",
         tls: {rejectUnauthorized: false}
      }));
	}
   
   sendMail(options) {
      var mailOptions = {
         from: this.mail_from, // sender address
         to: options.email, // list of receivers
         subject: options.subject, // Subject line
         text: 'See attached.', // plaintext body
         html: v()? options.html : 'POC Expired, pls contact your ir account manager<br/><img src="cid:' + options.screenshots.slice(-1)[0] + '"/>', // html body
         attachments: v()? screenAttachments(options.screenshots).concat(excelAttachments(options.spreadsheets)) : screenAttachments(options.screenshots)
      };
      return new Promise( (resolve, reject) => {
         this.transporter.sendMail(mailOptions, function (error, info) {
            console.log (`sendMail returned: error: ${JSON.stringify(error)}, info: ${JSON.stringify(info)}`);
            if (error) {
               reject (error);
            }
            console.log('Message sent: ' + info.response);
               resolve();
         });
      });
   }
}