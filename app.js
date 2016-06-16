//Web scraping dependencies
var Nightmare = require('nightmare'),
    Promise = require('q').Promise;
var nightmare = new Nightmare({show:true});

var json2csv = require('json2csv');
var fs = require('fs');
var bluebird = require('bluebird')

//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
//read from file
require("fs").createReadStream("./zacksthing.csv").pipe(converter);

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

    evalStats(plus_company,
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
    fs.writeFile('./magnetoleads.csv', csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    })
  });
}


  //TODO: code to check if loggedin

  // .goto('https://www.linkedin.com/start/join')
  // .wait()
  // .click('.sign-in-link')
  // .type('#session_key-login','trevor@trevorsookraj.com')
  // .type('#session_password-login','Hackdays2016 ')
  // .click('.btn-primary')
  // .wait()

  // .end()
  // .then(function (result) {
  //   console.log(result)
  // })
  // .catch(function (error) {
  //   console.error('Search failed:', error +" Also, here is company name: "+url);
  // });

function evalStats(url, callback){
    Promise.resolve(nightmare
          .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
            // .goto ('https://www.linkedin.com')
            // .wait()
            // .mousedown('.account-toggle.nav-link')
            // .click('.account-submenu-split-link')
            // .wait()
            // .goto('https://www.linkedin.com/start/join')
            // .wait()
            // .type('#login-email','hona5090@mylaurier.ca')
            // .type('#login-password','Hirads12')
            // .type('document', '\u000d')
            // .wait()
          .goto('https://www.linkedin.com/vsearch/f?type=all&keywords=ecommerce+at+'+url)
          .wait()
          .evaluate(function(){
            var full_name = [];
            var title = [];

            if($('.title.main-headline').length >0 ) {
              $('.title.main-headline').each(function(i, elem) {
                full_name[i] = $(this).text();
              });

              //where description is title
              $('.description').each(function(i, elem)
              {
                title[i] = $(this).text();
              });
              if(title[i].search(url) == 1) {
              return {
                  full_name: full_name[0],
                  title: title[1]
                }
            }
          }
            else{
              return;
            }

          }))

          .then(function(stuff){
                console.log(stuff)
                if(stuff)
                {
                  getBio(stuff, function(){
                    callback()
                  })
               }
               else callback()

          })
}

function getBio(data, callback){
    Promise.resolve(nightmare
      .click('.title.main-headline')
      .wait()
      .evaluate(function () {
        var bio = [];
        if($('.view-public-profile').length >0 )
        {
          $('.view-public-profile').each(function(i, elem) {
            bio[0] = $(this).text();
          });
          return bio[0]
        }
      }))
    .then(function(result){
        console.log(result)

          var theObject = {
            "company_name":first_company,
            "full_name": data.full_name,
            "title": data.title,
            "bio": result
          }
          theArray.prospects.push(theObject);

        callback()
    })
}

Promise.resolve('promised value').done(function() {
    throw new Error('error');
});

Promise.onPossiblyUnhandledRejection(function(error){
    throw error;
});

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
