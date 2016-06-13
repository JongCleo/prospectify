var Nightmare = require('nightmare');

//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

//end_parsed will be emitted once parsing finished
converter.on("end_parsed", function (jsonArray) {
  var first_company = jsonArray[0]['Company name'];
  console.log(first_company);
  var plus_company = first_company.split(" ");
  console.log(plus_company);
  evaluate(plus_company);
});

//read from file
require("fs").createReadStream("./test.csv").pipe(converter);

function evaluate(url)
{
  new Nightmare()
  .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")

  .goto('https://www.linkedin.com/vsearch/f?type=all&keywords=ecommerce+at+'+url[0]+['\+']+url[1])
  .wait()
  .screenshot('linkedin.png')
  .evaluate(function () {
    var full_name = [];
    var title = [];
//where main headline is full name
    console.log($('h2').text())
    $('.title.main-headline').each(function(i, elem) {
      full_name[i] = $(this).text();
      console.log(full_name[i]);
    });

//where description is title
    $('.description').each(function(i, elem) {
      title[i] = $(this).text();
    });

    return {
      full_namerc1: full_name[0],
      titlerc1: title[1]
    }
  })

  .end()
  .then(function (result) {
    //output in call back
    console.log(result)
  })
  .catch(function (error) {
    console.error('Search failed:', error);
  });

}

//
// .goto('https://www.linkedin.com/vsearch/f?type=all&keywords=ecommerce+at+'+url[0]+['\+']+url[1])
// .click('.title.main-headline')
// .wait()
// .screenshot('getbio.png')
// .evaluate(function () {
//   var bio = [];
//   if(typeof $('.view-public-profile') != "undefined")
//   {
//     $('.view-public-profile').each(function(i, elem) {
//       bio[0] = $(this).text();
//     });
//
//     return {
//       bio0: bio[0]
//     }
//   }
// })

/*  .goto('https://www.linkedin.com/start/join')
  .wait()
  .click('.sign-in-link')
  .type('#session_key-login','trevor@trevorsookraj.com')
  .type('#session_password-login','Hackdays2016 ')
  .click('.btn-primary')
  .wait()
*/
