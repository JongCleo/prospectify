var Nightmare = require('nightmare');

//read from file
if (process.argv.length < 3) {
  console.log ('Usage: node ' + process.argv[1] + './test.txt');
  process.exit(1);
}
var fs = require('fs')

//end_parsed will be emitted once parsing finished
function (jsonArray) {
  for(var i =0; i<jsonArray.length; i++)
  {
    var first_company = jsonArray[i]['Company name'];
    var plus_company = first_company.split(" ").join('+');
    console.log(plus_company);
    evalStats(plus_company);
    evalBio(plus_company);
  }

});

function evalStats(url)

{
  new Nightmare()

  .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
    // .goto('https://www.linkedin.com/start/join')
    // .wait()
    // .click('.sign-in-link')
    // .type('#session_key-login','trevor@trevorsookraj.com')
    // .type('#session_password-login','Hackdays2016 ')
    // .click('.btn-primary')
    // .wait()
  .goto('https://www.linkedin.com/vsearch/f?type=all&keywords=ecommerce+at+'+url)
  .wait()
  .wait()
  .evaluate(function () {
    var full_name = [];
    var title = [];

//where main headline is full name
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
    console.error('Search failed:', error +" Also, here is company name: "+url);
  });
return;
}

function evalBio(url)
{
  new Nightmare()
  .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
  .goto('https://www.linkedin.com/vsearch/f?type=all&keywords=ecommerce+at+'+url)
  .wait()
  .wait()
  .click('.title.main-headline')
  .wait()
  .evaluate(function () {
    var bio = [];
    if(typeof $('.view-public-profile') != "undefined")
    {
      $('.view-public-profile').each(function(i, elem) {
        bio[0] = $(this).text();
      });

      return {
        bio0: bio[0]
      }
    }
  })
  .end()
  .then(function (result) {
    //output in call back
    console.log(result)
  })
  .catch(function (error) {
    console.error('Search failed:', error+ " Also, here is company name: "+url);
  });
}


//
//
// .goto('https://www.linkedin.com/vsearch/f?type=all&keywords=ecommerce+at+'+url[0]+['\+']+url[1])
// .click('.title.main-headline')
// .wait()
// .evaluate(function () {
//   var bio = [];
//   if(typeof $('.view-public-profile') != "undefined")
//   {
//     $('.view-public-profile').each(function(i, elem) {
//       bio[0] = $(this).text();
//     });
//
//     return = {
//       bio0 : bio[0]
//     }
//   }
// })