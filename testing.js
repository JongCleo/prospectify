// Talking to front end
var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// DOM Element Scraping
var request = require('request');
request = request.defaults();
var cheerio = require("cheerio");
var find = require('cheerio-eq');
var blockspring = require("blockspring");
var stringSimilarity = require('string-similarity');

// Parsing between JSON and CSVs
var json2csv = require('json2csv');
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

//////////////////////////////////////////////////////////
var EMAIL_KEY = '2206f2d9f60d5e3e4420533c5df5bbb2f80aaa1f'
var BING_KEY ='br_35635_a286273c577861ff85f1c384cdff615c40f7be27'
/////////////////////////////////////////////////////////////

var first_company, plus_company;
var theArray = {
  prospects:[]
}
var regex_var = new RegExp(/(\.[^\.]{0,3})(\.[^\.]{0,2})(\.*$)|(\.[^\.]*)(\.*$)/);

var fileName = "test";
var fields = ['company_name', 'first_name',"last_name", 'domain', 'title', 'bio','email'];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/app.html'));
});

app.post('/uploads', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));

    fs.createReadStream(file.name).pipe(converter);
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
        exportdata(theArray.prospects, fields);
        app.get('/img/bg.png', function(req, res) {
            res.sendFile('public/img/background.png')
        })

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
    console.log('Our app is running on http://localhost:' + port);
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
              if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("digital") > -1) || (checkTitle[i].indexOf("chief technology") > -1) || (checkTitle[i].indexOf("founder") > -1)) && ((stringSimilarity.compareTwoStrings(checkTitle[i], first_company.toLowerCase()) > 0.6) || (description[i].indexOf(first_company.toLowerCase().replace("\’", "\'")) > -1)))
              {

                baseselector =".f.slp:eq("+i+")";

                bio = find($, baseselector).parent().children().first().children().first().text()
                elem = find($, baseselector).parent().parent().children().first().children().text()
                full_name = find($, baseselector).parent().parent().children().first().children().text().substring(0, elem.indexOf(' |'))
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

                      for (var i = 0; i < checkTitle.length; i ++)
                      {
                        if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("digital") > -1) || (checkTitle[i].indexOf("chief technology") > -1) || (checkTitle[i].indexOf("founder") > -1)) && ((stringSimilarity.compareTwoStrings(checkTitle[i], first_company.toLowerCase()) > 0.6)
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
                "email":""
              }
              theArray.prospects.push(theObject);
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
            }, function(res) {

              var theObject = {
                "company_name":first_company.split("+").join(' '),
                "first_name": full_name.split(' ').slice(0, -1).join(' '),
                "last_name": full_name.split(' ').slice(-1).join(' '),
                "domain": res.params.results.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0],
                "title": title,
                "bio": bio
              }
              console.log(theObject)

              request('https://api.emailhunter.co/v1/generate?domain='+theObject.domain+'&?company='+theObject.company_name+'&first_name='+theObject.first_name+'&last_name='+theObject.last_name+'&api_key='+EMAIL_KEY, function(error, response, body){
                var stuff = JSON.parse(body);
                if (stuff.status == 'success'){
                  theObject.email = stuff.email
                }
                else {
                  theObject.email = "";
                }
                theArray.prospects.push(theObject);
                callback()
              });
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
