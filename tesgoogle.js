var request = require('request');
request = request.defaults();
var cheerio = require("cheerio");
var find = require('cheerio-eq');



theURL= encodeURIComponent("Pier+1+Imports").toLowerCase()
console.log(theURL)

//function findLink(theURL, callback){
    var options = {
        url:  "https://www.google.ca/search?q=ecommerce+at+"+theURL+"+linkedin",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; rv:1.9.2.16) Gecko/20110319 Firefox/3.6.16'
        }
    };

    request(options, function (err, res, body) {
            var $ = cheerio.load(body);

            var checkTitle = []
            $(".f.slp").each(function(n){
              checkTitle[n] = $(this).text().toLowerCase()
            })
            var bio;
            var profileLink;
            var endselector, bioselector;

            for (var i = 0; i < checkTitle.length; i ++)
            {
              console.log(checkTitle[i])
              if( ((checkTitle[i].indexOf("commerce") > -1) || (checkTitle[i].indexOf("marketing") > -1) || (checkTitle[i].indexOf("founder") > -1)) && (checkTitle[i].indexOf("pier 1 imports") > -1))
              {

                baseselector =".f.slp:eq("+i+")";
                bioselector="cite:eq("+i+")";

                bio = find($, baseselector).parent().children().first().children().first().text()
                profileLink = find($, baseselector).parent().parent().children().first().children()

                break;
              }
            }

    });

//     Promise.resolve(nightmare
//           .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
//           .goto('https://www.google.ca/search?q=ecommerce+at+'+url+"+linkedin")
//           .wait()
//           .evaluate(function (){
//
//
//
//
//
//             found.each(function(i){
//
//             })
//
//             return {
//               linkTxt: profileLink,
//               // link: theLink,
//               bioTxt : bio
//             }
//
//           }))
//           .then(function(stuff){
//                 console.log("bio data: "+stuff)
//
//                 goProfile(stuff, function(){
//                   callback()
//                 })
//           })
// }
