var request = require('request');
request = request.defaults();
var cheerio = require("cheerio");
var find = require('cheerio-eq');

var Nightmare = require('nightmare'),
    Promise = require('q').Promise;
var nightmare = new Nightmare({show:true, openDevTools:true});

aURL = encodeURIComponent("Pier+1+Imports").toLowerCase()

var bio;
var profileLink;
var theArray = {
  prospects:[]
}

findLink(aURL, function(){

})

function findLink(theURL, callback){
    googleWrap(theURL, function(){
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
                // "company_name":first_company,
                //get domain
                "full_name": stuff.full_name,
                "title": stuff.title,
                "bio": bio
              }
              console.log(theObject)
              theArray.prospects.push(theObject);


              callback()
            })
    })
}

function googleWrap(url, callback){
  var options = {
      url:  "https://www.google.ca/search?q=ecommerce+at+"+url+"+linkedin",
      headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; rv:1.9.2.16) Gecko/20110319 Firefox/3.6.16'
      }
  }

  request(options, function (err, res, body) {
          var $ = cheerio.load(body);

          var checkTitle = []
          var elem
          var endselector, bioselector;

          $(".f.slp").each(function(n){
            checkTitle[n] = $(this).text().toLowerCase()
          })

          for (var i = 0; i < checkTitle.length; i ++)
          {

            if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("founder") > -1)) && (checkTitle[i].indexOf("pier 1 imports") > -1))
            {

              baseselector =".f.slp:eq("+i+")";
              bioselector="cite:eq("+i+")";

              bio = find($, baseselector).parent().children().first().children().first().text()
              elem = find($, baseselector).parent().parent().children().first().children().attr('href')
              profileLink = find($, baseselector).parent().parent().children().first().children().attr('href').substring(7, elem.indexOf('&'))

              break;
            }
          }
          console.log("done google scraping")
          callback()

  })
}
