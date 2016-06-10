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
  evaluate(first_company);
});

//read from file
require("fs").createReadStream("./test.csv").pipe(converter);

function evaluate(url)
{
  new Nightmare()
  .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
  .goto('https://www.linkedin.com/start/join')
  .wait()
  .click('.sign-in-link')
  .type('#session_key-login','trevor@trevorsookraj.com')
  .type('#session_password-login','password')
  .click('.btn-primary')
  .wait()
  .goto('https://www.linkedin.com/vsearch/f?type=all&keywords=ecommerce+at+'+url[0]+['\+']+url[1])
  .screenshot('nsdigger.png')
  .evaluate(function () {
    var full_name = [];
    var title = [];
    var bio = [];

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

//where link is bio
    $('.title.main-headline').each(function(i, elem) {
      bio[i] = $(this).href;
    });

    return {
      full_namerc1: full_name[0],
      full_namerc2: full_name[1],
      titlerc1: full_name[0],
      titlerc2: title[1],
      biorc1: bio[0],
      biorc2: bio[1],
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
