// Talking to front end and application configuration
var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var port = process.env.PORT || 8080;

// DOM Element Scraping
var request = require('request');
request = request.defaults();
var cheerio = require("cheerio");
var find = require('cheerio-eq');
var blockspring = require("blockspring");
var stringSimilarity = require('string-similarity');
var wappalyzer = require("wappalyzer");

// Parsing between JSON and CSVs
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

// Google Drive Upload
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

if (!process.env.CLIENT_ID){
	var tokens = fs.readFileSync('./client_secret.json', 'utf8')
}

var CLIENT_ID = process.env.CLIENT_ID || JSON.parse(tokens).web.client_id;
var CLIENT_SECRET = process.env.CLIENT_SECRET || JSON.parse(tokens).web.client_secret;
var REDIRECT_URL = process.env.REDIRECT_URL || JSON.parse(tokens).web.redirect_uris[0];
var SCOPES = ['https://www.googleapis.com/auth/drive.file'];
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
var authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES
});

//////////////////////////////////////////////////////////
var EMAIL_KEY = '2206f2d9f60d5e3e4420533c5df5bbb2f80aaa1f'
var BING_KEY ='br_35635_a286273c577861ff85f1c384cdff615c40f7be27'
/////////////////////////////////////////////////////////////

var first_company, plus_company;
var theArray = {
  prospects:[]
}
var regex_var = new RegExp(/(\.[^\.]{0,3})(\.[^\.]{0,2})(\.*$)|(\.[^\.]*)(\.*$)/);

var fields = ['company_name', 'first_name',"last_name", 'domain', 'title', 'bio','email','platform'];
var platformList = ['Magento',"Shopify","WooCommerce","Demandware","PrestaShop","OpenCart","Bigcommerce","Volusion","Zen Cart"];

app.use(express.static(path.join(__dirname, 'public')));

// Initial page redirecting to Google
app.get('/auth', function (req, res) {
    res.redirect(authUrl);
});

app.get('/oauth2callback', function (req, res) {
  var code = req.query.code;
  oauth2Client.getToken(code, function(err, token) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    }
    oauth2Client.credentials = token;
    res.redirect('/')
  });
});

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/app.html'));
});

app.post('/upload', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/upload');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {

    fs.rename(file.path, path.join(form.uploadDir, file.name));
    fs.createReadStream('upload/'+file.name).pipe(converter);
    converter.on("end_parsed", function (jsonArray) {
      syncLoop(jsonArray.length,

      function(loop){
        first_company = jsonArray[loop.iteration()]['Company name'].replace(regex_var, '').split('.').pop()
        plus_company = encodeURIComponent(first_company.toLowerCase().replace('llc','').replace('inc','').split(" ").join('+'))

        googleWrap(plus_company,
        function(){
          loop.next()
        })
      },

      function(){
        exportdata(theArray.prospects, fields, 'upload/'+file.name);
      })
    });
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);

});

var server = app.listen(port, function() {
    console.log('Our app is running on port:' + port);
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

            for (var i = 0; i < checkTitle.length; i ++)
            {
              if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("digital") > -1) || (checkTitle[i].indexOf("CEO") > -1) || (checkTitle[i].indexOf("chief technology") > -1) || (checkTitle[i].indexOf("founder") > -1)) && ((stringSimilarity.compareTwoStrings(checkTitle[i].substring(checkTitle[i].lastIndexOf('-')+3).replace(/\./g, ''), first_company.toLowerCase()) > 0.4) || (description[i].indexOf(first_company.toLowerCase().replace("\’", "\'")) > -1)))
              {

                baseselector =".f.slp:eq("+i+")";

                bio = find($, baseselector).parent().children().first().children().first().text()
                elem = find($, baseselector).parent().parent().children().first().children().text()
                full_name = find($, baseselector).parent().parent().children().first().children().text().substring(0, elem.indexOf(' |'))
                title = find($, baseselector).text()

                break;
              }
            }

            if(!title){
              for (var i = 0; i < checkTitle.length; i ++)
              {
                if( (stringSimilarity.compareTwoStrings(checkTitle[i].substring(checkTitle[i].lastIndexOf('-')+3).replace(/\./g, ''), first_company.toLowerCase()) > 0.4) || (description[i].indexOf(first_company.toLowerCase().replace("\’", "\'")) > -1) )
                {

                  baseselector =".f.slp:eq("+i+")";

                  bio = find($, baseselector).parent().children().first().children().first().text()
                  elem = find($, baseselector).parent().parent().children().first().children().text()
                  full_name = find($, baseselector).parent().parent().children().first().children().text().substring(0, elem.indexOf(' |'))
                  title = find($, baseselector).text()

                  break;
                }
              }
            }

            if(!title){
              request(options2, function (err, res, body) {
                      var $ = cheerio.load(body);
                      var checkTitle = [], description = [];
                      var elem, bio, profileLink, baseselector, title, full_name;

                      $(".f.slp").each(function(n){
                        checkTitle[n] = $(this).text().toLowerCase()
                        description[n] = $(this).parent().find('span').text().toLowerCase()
                      })

                      for (var i = 0; i < checkTitle.length; i ++)
                      {
                        if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("digital") > -1) || (checkTitle[i].indexOf("chief technology") > -1) || (checkTitle[i].indexOf("founder") > -1)) && ((stringSimilarity.compareTwoStrings(checkTitle[i].substring(checkTitle[i].lastIndexOf('-')+3).replace(/\./g, ''), first_company.toLowerCase()) > 0.4)
                        || (description[i].indexOf(first_company.toLowerCase().replace("\’", "\'")) > -1)))
                        {

                          baseselector =".f.slp:eq("+i+")";

                          bio = find($, baseselector).parent().children().first().children().first().text()
                          elem = find($, baseselector).parent().parent().children().first().children().text()
                          full_name = find($, baseselector).parent().parent().children().first().children().text().substring(0, elem.indexOf(' |'))
                          title = find($, baseselector).text()

                          break;
                        }
                      }

                      if(!title){
                        for (var i = 0; i < checkTitle.length; i ++)
                        {
                          if( (stringSimilarity.compareTwoStrings(checkTitle[i].substring(checkTitle[i].lastIndexOf('-')+3).replace(/\./g, ''), first_company.toLowerCase()) > 0.4) || (description[i].indexOf(first_company.toLowerCase().replace("\’", "\'")) > -1) )
                          {

                            baseselector =".f.slp:eq("+i+")";

                            bio = find($, baseselector).parent().children().first().children().first().text()
                            elem = find($, baseselector).parent().parent().children().first().children().text()
                            full_name = find($, baseselector).parent().parent().children().first().children().text().substring(0, elem.indexOf(' |'))
                            title = find($, baseselector).text()

                            break;
                          }
                        }
                      }
              })
            }

            if(!full_name){
              var theObject = {
                "company_name":first_company.split("+").join(' '),
                "first_name": "",
                "last_name": "",
                "domain": "",
                "title": "",
                "bio": "",
                "email":"",
                "platform":""
              }
              theArray.prospects.push(theObject);
              console.log(theObject)
              callback()
              return
            }

            blockspring.runParsed("web-search-top-result-bing",
            {
              "search_query": first_company.split("+").join(' '),
              "host_only": false
            },
            {
             api_key: BING_KEY
           }, function(domainRes) {

              if(!domainRes.params.results){
                var theObject = {
                  "company_name":first_company.split("+").join(' '),
                  "first_name": full_name.split(' ').slice(0, -1).join(' '),
                  "last_name": full_name.split(' ').slice(-1).join(' '),
                  "domain": "",
                  "title": title,
                  "bio": bio
                }
                request('https://api.emailhunter.co/v1/generate?company='+theObject.company_name+'&first_name='+encodeURIComponent(theObject.first_name)+'&last_name='+encodeURIComponent(theObject.last_name)+'&api_key='+EMAIL_KEY, function(error, response, body){

                  if(body.indexOf("<html>")>-1){
                    theObject.email = "";
                    theObject.platform ="";
                  }
                  else{
                    var stuff = JSON.parse(body);

                    if (stuff.status == 'success'){
                      theObject.email = stuff.email;
                      theObject.platform ="";
                    }
                    else {
                      theObject.email = "";
                      theObject.platform ="";
                    }
                  }

                  theArray.prospects.push(theObject);
                  callback()
                  console.log(theObject)
                });
              }
              else{

                var theObject = {
                  "company_name":first_company.split("+").join(' '),
                  "first_name": full_name.split(' ').slice(0, -1).join(' '),
                  "last_name": full_name.split(' ').slice(-1).join(' '),
                  "domain": domainRes.params.results.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0],
                  "title": title,
                  "bio": bio
                }

                request('https://api.emailhunter.co/v1/generate?domain='+theObject.domain+'&?company='+encodeURIComponent(theObject.company_name)+'&first_name='+encodeURIComponent(theObject.first_name)+'&last_name='+theObject.last_name+'&api_key='+EMAIL_KEY, function(error, response, body){

                  if(body.indexOf("<html>")>-1){
                    theObject.email = "";
                  }
                  else{
                    var stuff = JSON.parse(body);

                    if (stuff.status == 'success'){
                      theObject.email = stuff.email
                    }
                    else {
                      theObject.email = "";
                    }
                  }

                  var wapOptions = {
                    url: domainRes.params.results,
                    hostname: theObject.domain,
                    debug:false
                  }

                  wappalyzer.detectFromUrl(wapOptions, function(err,apps,appInfo){
                    if(err || !apps){
                      console.log(err)
                    }
                    else{
                      for (var i =0; i<apps.length; i++){
                        if(platformList.indexOf(apps[i]) >= 0){
                          theObject.platform = apps[i];
                          console.log("platform is: "+theObject.platform);
                          break;
                        }
                      }
                    }
                    theArray.prospects.push(theObject);
                    callback()
                    console.log(theObject)
                  })// end of wappalyzer request
                });// end of email hunter request
              }// end of else clause
            });// end of blockspring request
    })

  }, 7000)

 }

 function exportdata(dataSet, headers, theFile) {
   json2csv( { data: dataSet, fields: headers }, function(err, csv) {
     if (err) console.log(err);
     fs.writeFile(theFile+'export.csv', csv, function(err) {
       if (err) throw err;
       console.log('file saved');
			 uploadFile(oauth2Client, theFile+'export.csv');
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
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
  getNewToken(oauth2Client, callback);
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
      callback(oauth2Client);
    });
  });
}

function uploadFile(auth, fileName){
  var drive = google.drive('v3');

  /// convert csv to google spread spreadsheet
  var fileMetadata = {
    'name': fileName,
    'mimeType': 'application/vnd.google-apps.spreadsheet'
  };
  var media = {
    mimeType: 'text/csv',
    body: fs.createReadStream(fileName)
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
      console.log('done')
    }
  });

}
