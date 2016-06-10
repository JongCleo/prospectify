//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

//end_parsed will be emitted once parsing finished
converter.on("end_parsed", function (jsonArray) {
  var first_company = jsonArray[0]['Company name'];
  console.log(first_company);
});

//read from file
require("fs").createReadStream("./test.csv").pipe(converter);
