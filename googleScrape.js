//Web scraping dependencies
var Nightmare = require('nightmare'),
    Promise = require('q').Promise;
var nightmare = new Nightmare();

var request = require('request');
request = request.defaults();
var cheerio = require("cheerio");
var find = require('cheerio-eq');

var json2csv = require('json2csv');
var fs = require('fs');

var Converter = require("csvtojson").Converter;
var converter = new Converter({});
require("fs").createReadStream("demand.csv").pipe(converter);
/////////////////////////////////////////////////////////////

var first_company, plus_company;
var theArray = {
  prospects:[]
}

var fields = ['company_name', 'full_name', 'title', 'bio'];

converter.on("end_parsed", function (jsonArray) {

  syncLoop(10,

  function(loop){
    first_company = jsonArray[loop.iteration()]['Company name'].toLowerCase().replace('llc','').replace('inc','').split(" ").join('+');
    plus_company = encodeURIComponent(first_company)

    findLink(plus_company,
    function(){
      var nightmare = new Nightmare()
      loop.next()
    })
  },

  function(){
    exportdata(theArray.prospects, fields);
    nightmare.proc.disconnect();
    nightmare.proc.kill();
    nightmare.ended = true;
    console.log('done')
  })

});

function exportdata(dataSet, headers) {
  json2csv( { data: dataSet, fields: headers }, function(err, csv) {
    if (err) console.log(err);
    fs.writeFile('demandexport.csv', csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    })
  });
}


function findLink(url, callback){
    googleWrap(url, function(bio, profileLink){
      if(!profileLink)
      {
        var theObject = {
          "company_name":first_company.split("+").join(' '),
          //get domain
          "full_name": "",
          "title": "",
          "bio": ""
        }
        theArray.prospects.push(theObject);
        callback();
      }
      Promise.resolve(

        nightmare
            .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
            .goto(profileLink)
            .wait()
            .evaluate(function (){

              return {
                full_name: $('.full-name').text(),
                title: $('.title').text()
              }

            }))
            .then(function(stuff){

              var theObject = {
                "company_name":first_company.split("+").join(' '),
                //get domain
                "full_name": stuff.full_name,
                "title": stuff.title,
                "bio": bio
              }
              //console.log(theObject)
              theArray.prospects.push(theObject);

              callback()
            })
    })
}

function googleWrap(daurl, callback){
  var options = {
      url:  "https://www.google.ca/search?q=ecommerce+at+"+daurl+"+linkedin",
      headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; rv:1.9.2.16) Gecko/20110319 Firefox/3.6.16'
      }
  }

  request(options, function (err, res, body) {
          var $ = cheerio.load(body);

          var checkTitle = []
          var elem
          var endselector, bioselector;
          var bio;
          var profileLink;

          $(".f.slp").each(function(n){
            checkTitle[n] = $(this).text().toLowerCase()
          })

          for (var i = 0; i < checkTitle.length; i ++)
          {
            if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("digital") > -1) || (checkTitle[i].indexOf("chief technology") > -1) || (checkTitle[i].indexOf("founder") > -1)) && (checkTitle[i].indexOf(first_company.split("+").join(' ').replace("\’", "\'")) > -1))
            {

              baseselector =".f.slp:eq("+i+")";

              bio = find($, baseselector).parent().children().first().children().first().text()
              elem = find($, baseselector).parent().parent().children().first().children().attr('href')
              profileLink = find($, baseselector).parent().parent().children().first().children().attr('href').substring(7, elem.indexOf('&'))

              break;
            }

          }
          callback(bio, profileLink)

  })
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
