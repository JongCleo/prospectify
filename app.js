// For Client-Server communication and app setup.
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser')
var session = require('express-session')
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var port = process.env.PORT || 8080;

// Stuff used for web scraping.
var async = require('async')
var request = require('request');
request = request.defaults();
var cheerio = require("cheerio");
var find = require('cheerio-eq');
var blockspring = require("blockspring");
var stringSimilarity = require('string-similarity');
var wappalyzer = require("wappalyzer");

if (!process.env.CLIENT_ID){
	var keys = fs.readFileSync('./config.json', 'utf8')
}
var EMAIL_KEY = process.env.EMAIL_KEY || JSON.parse(keys).myData.API_TOKENS.email_key
var BING_KEY = process.env.BING_KEY || JSON.parse(keys).myData.API_TOKENS.bing_key

// Parsing between JSON and CSVs
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;

// Google Drive Upload
var google = require('googleapis');
var googleAuth = require('google-auth-library');
if (!process.env.CLIENT_ID){
	var tokens = fs.readFileSync('./client_secret.json', 'utf8')
}
var CLIENT_ID = process.env.CLIENT_ID || JSON.parse(tokens).web.client_id;
var CLIENT_SECRET = process.env.CLIENT_SECRET || JSON.parse(tokens).web.client_secret;
var REDIRECT_URL = process.env.REDIRECT_URL || JSON.parse(tokens).web.redirect_uris[1];
var SCOPES = ['https://www.googleapis.com/auth/drive.file'];
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
var authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
	prompt:"consent"
});

// Global variables
		// regex_var is used to extract Lowest Level Domain from inputs that are URLS
		// fields are the headers that are written to the output csv
		// platformList are the top ecommerce options to search for when running the wappalyzer check
		// sess is used for simultaneous user sessions
var regex_var = new RegExp(/(\.[^\.]{0,3})(\.[^\.]{0,2})(\.*$)|(\.[^\.]*)(\.*$)/);
var fields = ['company_name', 'first_name',"last_name", 'domain', 'title', 'bio','email','platform'];
var platformList = ['Magento',"Shopify","WooCommerce","Demandware","PrestaShop","OpenCart","Bigcommerce","Volusion","Zen Cart"];
var sess = {
  secret: '1234567890QWERTY',
  cookie: {},
	resave: true,
	saveUninitialized: true
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session(sess));

// Authorization callback redirects to homepage
app.get('/oauth2callback', function (req, res) {
  var code = req.query.code;
  oauth2Client.getToken(code, function(err, token) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    }
		req.session.credentials = token;
    res.redirect('/')
  });
});

app.get('/', function(req, res){
	if(req.session.credentials){
		res.sendFile(path.join(__dirname, 'views/app.html'));
	}
	else{
		res.redirect(authUrl);
	}
});

app.post('/upload', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/upload');

  form.on('file', function(field, file) {
		console.log("file received")

		// theArray stores each processed contact.
		var theArray = {
			prospects:[]
		}, company_input, url_input;
		var converter = new Converter({});

    fs.rename(file.path, path.join(form.uploadDir, file.name));
    fs.createReadStream('upload/'+file.name).pipe(converter);

		// When the file is parsed, go through each row in the csv and get a prospect
		// to match each company. Afterwards, export theArray into a new csv and
		// upload it to the user's G-drive.
    converter.on("end_parsed", function (jsonArray) {
      syncLoop(jsonArray.length,

      function(loop){
				if(!jsonArray[loop.iteration()]['Company name']){
					loop.next()
				}
				else{
					setTimeout(function () {
						company_input = jsonArray[loop.iteration()]['Company name'].replace(regex_var, '').split('.')[0]
						url_input = encodeURIComponent(company_input.toLowerCase().replace('llc','').replace('inc','').split(" ").join('+'))

						processTheContact(company_input,url_input,
						function(returnedContact){
							theArray.prospects.push(returnedContact);
							console.log(returnedContact)
							loop.next()
						})
					}, 8000)
				}
      },

      function(){
				oauth2Client.credentials = req.session.credentials
        exportdata(theArray.prospects, fields, file.name);
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

/* processTheContact() uses companyName,
	 and companyURL (URL friendly text that's inserted into the query)
	 to return a thoroughly researched prospect in the callback()
*/

function processTheContact(companyName, companyURL, callback) {
	async.waterfall([

		// First attempt to search for a prospect using the query "ecommerce at company name linkedin"
		function(callback){
			var options = {
					url:  "https://www.google.ca/search?q=ecommerce+at+"+companyURL+"+linkedin",
					headers: {
							'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; rv:1.9.2.16) Gecko/20110319 Firefox/3.6.16'
					}
			}

			googleQuery(options, companyName, function(theContact){ callback(null, theContact); })
		},

		// Second attempt to search for a prospect using the query "marketing at company name linkedin"
		function(theContact, callback){
			if(!theContact.first_name){
				var options = {
						url:  "https://www.google.ca/search?q=marketing+at+"+companyURL+"+linkedin",
						headers: {
								'User-Agent': 'Mozilla/5.0 (compatible, MSIE 11, Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'
						}
				}

				googleQuery(options, companyName, function(contact){ callback(null, contact); })
			}
			else{
				callback(null, theContact);
			}
		},

		// Uses blockspring's api to find the lowest level domain based on the companyName.
		function(theContact, callback){
			if(!theContact.first_name){
				callback(null, theContact, null)
				return;
			}

			blockspring.runParsed("web-search-top-result-bing",
			{
				"search_query": companyName,
				"host_only": false
			},
			{
			 api_key: BING_KEY
			}, function(domainRes) {
				if(domainRes.params.results){ theContact.domain = domainRes.params.results.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0]	}
				callback(null, theContact, domainRes.params.results)
			})
		},

		// Uses emailhunter api to find the prospect's email
		function(theContact, wapURL, callback){
			if(!theContact.first_name){
				callback(null, theContact, null)
				return;
			}

			if(!theContact.domain){
				request('https://api.emailhunter.co/v1/generate?company='+theContact.company_name+'&first_name='+encodeURIComponent(theContact.first_name)+'&last_name='+encodeURIComponent(theContact.last_name)+'&api_key='+EMAIL_KEY,
				function(error, response, body){
					if(body.indexOf("<html>") == -1){
						var stuff = JSON.parse(body);
						if (stuff.status == 'success'){
							theContact.email = stuff.email;
						}
					}
					callback(null, theContact, null)
					return
				});
			}
			else{
				request('https://api.emailhunter.co/v1/generate?domain='+theContact.domain+'&?company='+encodeURIComponent(theContact.company_name)+'&first_name='+encodeURIComponent(theContact.first_name)+'&last_name='+theContact.last_name+'&api_key='+EMAIL_KEY, function(error, response, body){
						if(body.indexOf("<html>") == -1){
							var stuff = JSON.parse(body);
							if (stuff.status == 'success'){
								theContact.email = stuff.email;
							}
						}
						callback(null, theContact, wapURL)
						return
					});
			}
		},

		// Uses wappalyzer api to find the ecommerce platform if available.
		function(theContact, wapURL, callback){

				if(wapURL){
					var wapOptions = {
						url: wapURL,
						hostname: theContact.domain,
						debug:false
					}

					wappalyzer.detectFromUrl(wapOptions, function(err,apps,appInfo){
						if(err || !apps){
							console.log(err)
						}
						else{
							for (var i =0; i<apps.length; i++){
								if(platformList.indexOf(apps[i]) >= 0){
									theContact.platform = apps[i];
								}
							}
						}
						callback(null, theContact)
						return
					})
				}
				else{
					callback(null, theContact)
				}
		}
	], function(err, theContact){	callback(theContact) })
}

/* googleQuery() uses the options (containing the user agent and search query)
	 to search for the best matching linkedin profile for a given company.
	 It will return a javascript object containing the contact's company, first
	 name, last name, and linkedin url
*/
function googleQuery(options, companyName, callback) {

	request(options, function (err, res, body) {
			var $ = cheerio.load(body), checkTitle = [], description = [];
			var baseselector, full_name, elem, theContact = {
				"company_name":companyName,
				"first_name": "",
				"last_name": "",
				"domain": "",
				"title": "",
				"bio": "",
				"email":"",
				"platform":""
			}

			// $(".f.slp") is a class selector only search results that are linkedin profiles
			// will return. This is how it filters general search results to only linkedin profiles.
			$(".f.slp").each(function(n){
				checkTitle[n] = $(this).text().toLowerCase()
				description[n] = $(this).parent().find('span').text().toLowerCase()
			})

			// For each linkedin result, look for an ecommerce/marketing specialist at the given company.
			for (var i = 0; i < checkTitle.length; i ++)
			{
				if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("digital") > -1) || (checkTitle[i].indexOf("CEO") > -1) || (checkTitle[i].indexOf("technology") > -1) || (checkTitle[i].indexOf("founder") > -1)) && ((stringSimilarity.compareTwoStrings(checkTitle[i].substring(checkTitle[i].lastIndexOf('-')+3).replace(/\./g, ''), companyName.toLowerCase()) > 0.4) || (description[i].indexOf(companyName.toLowerCase().replace("\’", "\'")) > -1)))
				{

					baseselector =".f.slp:eq("+i+")";
					elem = find($, baseselector).parent().parent().parent().children().first().children().text()
					full_name = elem.substring(0, elem.indexOf(' |'))
					theContact.first_name = full_name.split(' ').slice(0, -1).join(' ')
					theContact.last_name = full_name.split(' ').slice(-1).join(' ')
					theContact.bio = find($, baseselector).parent().children().first().children().first().text()
					theContact.title = find($, baseselector).text()

					break;
				}
			}

			// If the first search didn't work, loosen up the filter to only look for a company name match.
			if(!theContact.first_name){
				for (var i = 0; i < checkTitle.length; i ++)
				{
					if( (stringSimilarity.compareTwoStrings(checkTitle[i].substring(checkTitle[i].lastIndexOf('-')+3).replace(/\./g, ''), companyName.toLowerCase()) > 0.4) || (description[i].indexOf(companyName.toLowerCase().replace("\’", "\'")) > -1) )
					{

						baseselector =".f.slp:eq("+i+")";
						elem = find($, baseselector).parent().parent().parent().children().first().children().text()
						full_name = elem.substring(0, elem.indexOf(' |'))
						theContact.first_name = full_name.split(' ').slice(0, -1).join(' ')
						theContact.last_name = full_name.split(' ').slice(-1).join(' ')
						theContact.bio = find($, baseselector).parent().children().first().children().first().text()
						theContact.title = find($, baseselector).text()

						break;
					}
				}
			}
			callback(theContact)
		})
}

// exportData() writes the dataSet and header into a finished csv
// and calls uploadFile() upon completion.
function exportdata(dataSet, headers, theFile) {
	json2csv( { data: dataSet, fields: headers }, function(err, csv) {
		if (err) console.log(err);
		fs.writeFile('upload/'+theFile+'export.csv', csv, function(err) {
			if (err) throw err;
			console.log('file saved');
			uploadFile(oauth2Client, theFile+'export.csv');
		})
	});
}

// uploadFile() sends the processed csv into the user's google drive.
function uploadFile(auth, fileName){
  var drive = google.drive('v3');

  /// convert csv to google spread spreadsheet
  var fileMetadata = {
    'name': fileName,
    'mimeType': 'application/vnd.google-apps.spreadsheet'
  };
  var media = {
    mimeType: 'text/csv',
    body: fs.createReadStream('upload/'+fileName)
  };

  drive.files.create({
     resource: fileMetadata,
     media: media,
     fields: 'id',
     auth: auth
  }, function(err, file) {
    if(err) {
      // Handle error
      console.log(err+"retrying with refreshtokens");
			auth.refreshAccessToken(function(err, tokens){
				if(err){
						console.log(err+"damn son no refreshtokens. Now we're screwed.")
						return
				}
				else{
					auth.credentials = tokens;
					drive.files.create({
				     resource: fileMetadata,
				     media: media,
				     fields: 'id',
				     auth: auth
				  }, function(err, file) {
				    if(err) {
				      // Handle error
				      console.log(err+"damn son now we're screwed.");
						}
						else {
				      console.log('FUCK YEAH MOTHERFUCKER REFRESH TOKENS PULLED THROUGH!!!! File Id:' , file.id);
				      console.log('done')
				    }
					})
				}
			})
    }
		else {
      console.log('File Id:' , file.id);
      console.log('done')
    }
	 })
}

// A synchronous loop method.
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
