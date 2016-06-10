var Nightmare = require('nightmare');

//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

//end_parsed will be emitted once parsing finished
converter.on("end_parsed", function (jsonArray) {
  var first_company = jsonArray[0]['Company name'];
  console.log(first_company);


  // for every company in jsonArray
      evaluate(jsonArray[i]['Company name'])
});

//read from file
require("fs").createReadStream("./test.csv").pipe(converter);








function evaluate(url)
{
  new Nightmare()
  .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
  .goto('https://www.similarweb.com/website/'+url)
  .wait()
  .evaluate(function () {
    var referrals = [];

    $('.websitePage-listItemLink.js-tooltipTarget').each(function(i, elem) {
      referrals[i] = $(this).text();
    });
    return {
      bounce: $('.icon-bounce-rate').parent().parent().children('.engagementInfo-value').text(),
      referralPercent: $('.subheading-value.referrals').text(),
      referralSrc1: referrals[0],
      referralSrc2: referrals[1],
      referralSrc3: referrals[2],
      referralSrc4: referrals[3],
      referralSrc5: referrals[4]
    }
  })
  .end()
  .then(function (result) {
    //output in call back
  })
  .catch(function (error) {
    console.error('Search failed:', error);
  });

}
