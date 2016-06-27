//Web scraping dependencies
var Promise = require('q').Promise;
var express = require('express');
var app = express();

var blockspring = require("blockspring");

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

var request = require('request');
request = request.defaults();
var cheerio = require("cheerio");
var find = require('cheerio-eq');

var json2csv = require('json2csv');
var fs = require('fs');

var Converter = require("csvtojson").Converter;
var converter = new Converter({});

var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
//////////////////////////////////////////////////////////

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/drive.file'];
var TOKEN_DIR = '.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-app.json';
/////////////////////////////////////////////////////////////

var first_company, plus_company;
var theArray = {
  prospects:[]
}

var fileName = "test"
var fields = ['company_name', 'first_name',"last_name", 'domain', 'title', 'bio'];

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});

require("fs").createReadStream(fileName+".csv").pipe(converter);
converter.on("end_parsed", function (jsonArray) {
  syncLoop(jsonArray.length,

  function(loop){
    first_company = jsonArray[loop.iteration()]['Company name'];
    plus_company = encodeURIComponent(first_company.toLowerCase().replace('llc','').replace('inc','').split(" ").join('+'))

    googleWrap(plus_company,
    function(){
      loop.next()
    })
  },

  function(){
    exportdata(theArray.prospects, fields);
    // Load client secrets from a local file.
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the
      // Drive API.
      authorize(JSON.parse(content), uploadFile);
      console.log('done')
      process.exit()
    });
  })
});

function googleWrap(googleUrl, callback){
  var options = {
      url:  "https://www.google.ca/search?q=ecommerce+at+"+googleUrl+"+linkedin",
      headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; rv:1.9.2.16) Gecko/20110319 Firefox/3.6.16'
      }
  }

  var options2 = {
      url:  "https://www.google.ca/search?q=marketing+at+"+googleUrl+"+linkedin",
      headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; rv:1.9.2.16) Gecko/20110319 Firefox/3.6.16'
      }
  }

  setTimeout(function () {

    // get the bio, name and title
    request(options, function (err, res, body) {
            var $ = cheerio.load(body);
            var checkTitle = [], description = [];
            var elem, bio, profileLink, baseselector, title, full_name;

            $(".f.slp").each(function(n){
              checkTitle[n] = $(this).text().toLowerCase()
              description[n] = $(this).parent().find('span').text().toLowerCase()
            })
            console.log(first_company)
            for (var i = 0; i < checkTitle.length; i ++)
            {
              if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("digital") > -1) || (checkTitle[i].indexOf("chief technology") > -1) || (checkTitle[i].indexOf("founder") > -1)) && ((checkTitle[i].indexOf(first_company.toLowerCase().replace("\’", "\'")) > -1)
              || (description[i].indexOf(first_company.toLowerCase().replace("\’", "\'")) > -1)))
              {

                baseselector =".f.slp:eq("+i+")";

                bio = find($, baseselector).parent().children().first().children().first().text()
                elem = find($, baseselector).parent().parent().children().first().children().text()
                full_name = find($, baseselector).parent().parent().children().first().children().text().substring(0, elem.indexOf('|'))
                title = find($, baseselector).text()

                break;
              }
            }

            if(!profileLink){
              request(options2, function (err, res, body) {
                      var $ = cheerio.load(body);
                      var checkTitle = [], description = [];
                      var elem, bio, profileLink, baseselector, title, full_name;

                      $(".f.slp").each(function(n){
                        checkTitle[n] = $(this).text().toLowerCase()
                        description[n] = $(this).parent().find('span').text().toLowerCase()
                      })

                      console.log(first_company);
                      for (var i = 0; i < checkTitle.length; i ++)
                      {
                        if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("digital") > -1) || (checkTitle[i].indexOf("chief technology") > -1) || (checkTitle[i].indexOf("founder") > -1)) && ((checkTitle[i].indexOf(first_company.toLowerCase().replace("\’", "\'")) > -1)
                        || (description[i].indexOf(first_company.toLowerCase().replace("\’", "\'")) > -1)))
                        {

                          baseselector =".f.slp:eq("+i+")";

                          bio = find($, baseselector).parent().children().first().children().first().text()
                          elem = find($, baseselector).parent().parent().children().first().children().text()
                          full_name = find($, baseselector).parent().parent().children().first().children().text().substring(0, elem.indexOf('|'))
                          title = find($, baseselector).text()

                          break;
                        }
                      }
              })
            }

            blockspring.runParsed("web-search-top-result-bing",
            {
              "search_query": first_company.split("+").join(' '),
              "host_only": false
            },
            {
             api_key: "br_35635_a286273c577861ff85f1c384cdff615c40f7be27"
            }, function(res) {

              var theObject = {
                "company_name":first_company.split("+").join(' '),
                "first_name": full_name.split(' ').slice(0, -1).join(' '),
                "last_name": full_name.split(' ').slice(-1).join(' '),
                "domain": res.params.results,
                "title": title,
                "bio": bio
              }
              theArray.prospects.push(theObject);
              callback()
            });
    })

  }, 9000)

 }

 function exportdata(dataSet, headers) {
   json2csv( { data: dataSet, fields: headers }, function(err, csv) {
     if (err) console.log(err);
     fs.writeFile(fileName+'export.csv', csv, function(err) {
       if (err) throw err;
       console.log('file saved');
     })
   });
 }

function syncLoop(iterations, process, exit){
    var index = 0,
        done = false,
        shouldExit = false;
    var loop = {
        next:function(){
            if(done){
                if(shouldExit && exit){
                    return exit(); // Exit if we're done
                }
            }
            // If we're not finished
            if(index < iterations){
                index++; // Increment our index
                process(loop); // Run our process, pass in the loop
            // Otherwise we're done
            } else {
                done = true; // Make sure we say we're done
                if(exit) exit(); // Call the callback on exit
            }
        },
        iteration:function(){
            return index - 1; // Return the loop number we're on
        },
        break:function(end){
            done = true; // End the loop
            shouldExit = end; // Passing end as true means we still call the exit callback
        }
    };
    loop.next();
    return loop;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function uploadFile(auth){
  var drive = google.drive('v3');

  /// convert csv to google spread spreadsheet
  var fileMetadata = {
    'name': fileName,
    'mimeType': 'application/vnd.google-apps.spreadsheet'
  };
  var media = {
    mimeType: 'text/csv',
    body: fs.createReadStream(fileName+'export.csv')
  };
  drive.files.create({
     resource: fileMetadata,
     media: media,
     fields: 'id',
     auth: auth
  }, function(err, file) {
    if(err) {
      // Handle error
      console.log(err);
    } else {
      console.log('File Id:' , file.id);
    }
  });

}
