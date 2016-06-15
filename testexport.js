var json2csv = require('json2csv');
var fs = require('fs');

var fields = ['company_name', 'full_name', 'title', 'bio'];
var myData = [
  {
    "company_name": "Burt's Bees",
    "full_name": "Kennedy Carruthers Embree",
    "title": "Associate Manager, Ecommerce & Digital at Burt/'s Bees",
    "bio": "https://www.linkedin.com/in/kennedyembree"
  }, {
        "company_name": "Ralph Lauren",
        "full_name": "Barbara Garces",
        "title": "Vice President, Digital & Ecommerce at Ralph Lauren",
        "bio": "https://www.linkedin.com/in/barbaragarces"
      }, {
            "company_name": "Jo-Ann Stores",
            "full_name": "Chris DiTullio",
            "title": "Senior Vice President, Marketing & Omni-Channel at Jo-Ann Stores, LLC.",
            "bio": "https://www.linkedin.com/in/chris-ditullio-b862001"
         }
];


function exportdata(dataSet, headers) {
  json2csv( { data: dataSet, fields: headers }, function(err, csv) {
    if (err) console.log(err);
    fs.writeFile('./testexport.csv', csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    })
  });
}

exportdata(myData, fields);
