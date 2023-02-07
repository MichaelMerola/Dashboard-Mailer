const puppeteer = require('puppeteer');
const profiles = require('../../../../../WebUI/IIS/Administration/Config/dashboardmailer.json');
const config = require('./config.json');

let screenshotnames  = [],
    spreadsheetnames = [],
    emailHtml        = [],
    browserlog       = config.browserlog || true,
    wait             = config.wait || 500,
    waitafterlogin   = config.waitafterlogin || 5000,
    waitforgobutton  = config.waitforgobutton || 5000,
    waitafterload    = config.waitafterload || 30000,
    waitafterexport  = config.waitafterexport || 5000;

function ExtractParam(url, regex) {
   var regex = new RegExp(regex),
   result = regex.exec(url);
   return result === null ? "" : decodeURIComponent(result[1].replace(/\+/g, " "));
}

function getDateString() {
   var d = new Date(),
       YY = d.getFullYear(),
       MM = ('0' + (d.getMonth() + 1)).slice(-2),
       DD = ('0' + d.getDate() ).slice(-2),
       hh = ('0' + d.getHours() ).slice(-2),
       mm = ('0' + d.getMinutes() ).slice(-2),
       ss = ('0' + d.getSeconds() ).slice(-2);
   return YY + MM + DD + '_' + hh + mm + ss;
}

function getEmailHTML(description) {
   return `<span style="font-weight:bold;">${description}</span><br><br>` + 
            emailHtml.join('<br><span style="font-family:courier, courier new, serif;">--*--*--*--*--*--*--*--*--*--*--*--</span><br><br>');
}

function getFailedHTML(description) {
   return `<span style="font-weight:bold;">${description}</span><br><br>
           <span style="color:red; font-size:2em;">Login failed</span><br><br>
           <img src="cid:login.png"/><br>
            `;
}

async function closeNavigation(page) {
   console.log (`closeNavigation() ...`);
   return await page.evaluate(() => {
      if ($('#idHtml_NavPanel').css('width') != '0px')
         $('.dijitSplitterThumb').click();
   });
   // Prognosis.Navigation.setNavigationClose(true);
}

async function login(page, creds, url) {
   console.log (`login() ...`);
   return new Promise (async(resolve) => {
      console.log (`login() :: goto ${url} ...`);
      await page.goto(url);
      console.log (`login() :: wait for ${wait} ms ...`);
      await page.waitFor(wait);
      console.log (`login() :: Fill in username/password and click Login ...`);
      page.evaluate( function(user, pass) {
         $('#UserName').val(user);
         $('#Password').val(pass);
         $('#loginButton').click();
         console.log('logging in: user: ' + user);
      }, creds.user, creds.password) //arguments to the function
      .then (async() => {
         console.log (`login() :: wait for ${waitafterlogin} ms after Login ...`);
         await page.waitFor(waitafterlogin);
         console.log(`login() :: taking screenshot of login page ...`);
         await page.screenshot({path: 'login.png'});
         console.log (`login() :: Verify if login was successful ...`);
         page.waitForSelector('#loginButton', {timeout: waitafterlogin})
         .then(() => {
            console.log(`login() :: login failed, still on login page`);
            resolve(false);
         })
         .catch (async(err) => {
            console.log (`login() :: Logged in successfully`);
            closeNavigation(page);
            await page.waitFor(wait);
            resolve(true);
         });
      })
      .catch ((err) => {
         console.log (`login() :: Login failed, err:  ${JSON.stringify(err, null, '   ')}`);
         resolve(false);
      });
   });
}

function captureDashboard(page, url) {
   var dashboard = ExtractParam(url, "\/Dashboard\/([^\?]*)"),
       server = ExtractParam(url, ":\/\/([^\/]+)"),
       datestr = getDateString(),
       dashboardfile = dashboard.replace(/ /g, '_') + '_' + datestr + '.png';
   console.log (`captureDashboard() :: Processing ${dashboard} ...`);
   return new Promise ( async (resolve) => {
      console.log (`captureDashboard() :: goto ${url} ...`);
      await page.goto(url);
      console.log (`captureDashboard() :: wait for go button ...`);
      page.waitForSelector('#idHtml_CentralReport_GoBtn', {timeout: waitforgobutton})
         .then(async() => {
            console.log(`captureDashboard() :: got GO button`);
            await page.evaluate(() => {   
               console.log ('Click on GO button');
               $('#idHtml_CentralReport_GoBtn').click();
            });
         })
         .catch ((err) => {
            console.log (`captureDashboard() :: Did not find a Go button`);
         });
      console.log (`captureDashboard() :: wait for ${waitafterload} ms after loading ...`);
      await page.waitFor(waitafterload);
      console.log (`captureDashboard() :: Click on Excel Export button ...`);
      await page.evaluate(() => {
         $('#idHtml_AppBar_ExcelExport').click();
      });
      console.log (`captureDashboard() :: wait for ${waitafterexport} ms after export ...`);
      await page.waitFor(waitafterexport);
      screenshotnames.push( dashboardfile);
      
      let dashboardHtml = "Dashboard : " + '<a href="' + url + '">' + dashboard + '</a><br><br>';
      dashboardHtml += '<img src="cid:' + screenshotnames.slice(-1)[0] + '"/><br>';
      emailHtml.push(dashboardHtml);
      console.log (`captureDashboard() :: taking screenshot ${dashboardfile} ...`);
      await page.screenshot({path: dashboardfile});
      resolve();
   });
}

function optionHeadless() {
   console.log (`optionHeadless() :: check if browser needs to run in headless mode. For SYSTEM user it only runs in headless mode`);
   let os = require('os');
   let username = os.userInfo().username;
   let headless = config.headless || false;
   if (username == 'SYSTEM')
      headless = true;
   console.log (`optionHeadless() :: user: ${username}, headless: ${headless}`);
   return headless;
}

async function createBrowser() {
   const size = `${config.width || 1920},${config.height || 1080}`
   console.log (`createBrowser() :: creating a browser, size:${size} ...`);
   return browser = await puppeteer.launch({
      headless: optionHeadless(),
      defaultViewport: null,
      slowMo: config.slowmo || 250,
      args: [
         '--ignore-certificate-errors',
         `--window-size=${size}`
            ]
   });
}

async function createPage(browser) {
   console.log (`createPage() :: creating a new page in browser ...`);
   const page = await browser.newPage();
   if (config.browserlog)
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));
   
   page.on('response', response => {
      const url = response.request().url();
      let filename = response.headers()['content-disposition'];
      if (filename) {
         const regexp = /filename=(.*\.xlsx)/gi;
         let match = regexp.exec(filename);
         if (match) {
            filename = match[1]
            console.log (`downloaded excel export file: '${filename}'`);
            spreadsheetnames.push (filename);
         } else {
            console.log (`downloaded file but not an excel export: '${filename}'`);
         }
      }
   });
   await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: __dirname,
   });
   return page;
}
module.exports = class capture {

   constructor(profile, creds){
      this.profile   = profile;
      this.creds     = creds;
      this.page      = undefined;
   }
   
   async setup() {
      console.log (`setup() :: setting up a new browser ...`);
      if (this.page) {
         console.log (`page already created`);
         return;
      }
      this.browser   = await createBrowser();
      this.page      = await createPage(this.browser);
   }
   
   async captureDashboards() {
      console.log (`captureDashboards() ...`);
      let dashboards = [],
          email = '',
          description = '';
      if (profiles.dashboard_profiles[this.profile]) {
         dashboards = profiles.dashboard_profiles[this.profile].dashboards;
         email = profiles.dashboard_profiles[this.profile].email;
         description = profiles.dashboard_profiles[this.profile].description;
      }
      const url = ExtractParam(dashboards.slice(-1)[0], "(.*\/Prognosis)\/Dashboard\/.+") + "/Login";
      let loggedin = await login(this.page, this.creds, url);
      if (!loggedin)
         return Promise.resolve({screenshots: ['login.png'], spreadsheets: spreadsheetnames, html: getFailedHTML(description)});
      
      return new Promise ( (resolve) => {
         dashboards.reduce( async (promise, dashboard, index) => {
            await promise;
            console.log (`processing ${dashboard}, index: ${index}`);
            await captureDashboard(this.page, dashboard);
            if (index == dashboards.length - 1) {  // Only resolve after last dashboard is processed
               let data = {screenshots: screenshotnames, spreadsheets: spreadsheetnames, html: getEmailHTML(description)};
               console.log (`captureDashboards() : ${JSON.stringify(data, null, '   ')}`);
               resolve (data);
            }
         }, Promise.resolve());
         
         
      });
   }
   
   closeBrowser() {
      console.log (`closeBrowser()`);
      this.browser.close();
   }
}