//Web scraping dependencies
var Nightmare = require('nightmare'),
    Promise = require('q').Promise;
var nightmare = new Nightmare({show:true});

var json2csv = require('json2csv');
var fs = require('fs');

//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
//read from file
require("fs").createReadStream("test.csv").pipe(converter);

//end_parsed will be emitted once parsing finished

var first_company, plus_company;
var theArray = {
  prospects:[]
}
var fields = ['company_name', 'full_name', 'title', 'bio'];

converter.on("end_parsed", function (jsonArray) {

  syncLoop(jsonArray.length,

  function(loop){
    first_company = jsonArray[loop.iteration()]['Company name'].toLowerCase().replace('llc','').replace('inc','');
    plus_company = first_company.split(" ").join('+');
    console.log(plus_company);

    findLink(plus_company,
    function(){
      // nightmare.proc.disconnect();
      // nightmare.ended = true;
      var nightmare = new Nightmare({show:true})
      loop.next()
    })
  },

  function(){
    exportdata(theArray.prospects, fields);
    console.log('done')
  })

});

function exportdata(dataSet, headers) {
  json2csv( { data: dataSet, fields: headers }, function(err, csv) {
    if (err) console.log(err);
    fs.writeFile('testexport.csv', csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    })
  });
}

function findLink(url, callback){
    Promise.resolve(nightmare
          .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
          .goto('https://www.google.ca/search?q=ecommerce+at+'+url+"+linkedin")
          .wait()
          .evaluate(function(){

            var checkTitle = [];
            var bio;
            var profileLink;

            $(.f.slp).each(function(i, elem){
              checkTitle[i] = $(this).text().toLowerCase();
              if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("founder") > -1)) && (checkTitle[i].indexOf(url.split("+").join(" ")) > -1))
              {
                bio = $(this).parent().find("._Rm")
                profileLink = $(this).parent().parent().parent().find('h3')
                break;
              }
            });

            return {
                retLink: profileLink,
                retBio : bio
            }

          }))
          .then(function(stuff){
                console.log(stuff)
                if(stuff)
                {
                  goProfile(stuff, function(){
                    callback()
                  })
                }
                else callback()
          })
}

function goProfile(data, callback){
    Promise.resolve(nightmare
      .click(data.retLink)
      .wait()
      .evaluate(function () {

        return {
          full_name: $('.full-name').text(),
          title: $('.title.field-text').text()
        }

      }))
      .then(function(result){
        console.log(result)

          var theObject = {
            "company_name":first_company,
            //get domain
            "full_name": result.full_name,
            "title": result.title,
            "bio": data.retBio
          }
          theArray.prospects.push(theObject);

        callback()
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
