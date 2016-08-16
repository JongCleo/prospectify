var request = require('request');
// Parsing between JSON and CSVs
var json2csv = require('json2csv');
var fs = require('fs');

var allSlackers = {}, headers=['first_name','last_name','email','title'];
people=[]


request('https://slack.com/api/users.list?token='+ "xoxb-44664530640-Un0PeouK1Es0NxSqmpWxzhZU", function(error, response, body){

  allSlackers = JSON.parse(body);

  for (var n = 0; n < allSlackers.members.length; n++){
      //skip instances of guru
      if(allSlackers.members[n].profile.title && allSlackers.members[n].profile.title.toLowerCase().indexOf("guru") == -1){
        var addMe = {
          "first_name": allSlackers.members[n].profile.first_name,
          "last_name": allSlackers.members[n].profile.last_name,
          "email": allSlackers.members[n].profile.email,
          "title": allSlackers.members[n].profile.title,
        }
        people.push(addMe)
        console.log(addMe)
      }

      if(n == allSlackers.members.length-1){
        console.log("exporting..")
        exportdata(people, headers)
      }
  }

});


// exportData() writes the dataSet and header into a finished csv
// and calls uploadFile() upon completion.
function exportdata(dataSet, headers) {
	json2csv( { data: dataSet, fields: headers }, function(err, csv) {
		if (err) console.log(err);
		fs.writeFile('Shopifyexport.csv', csv, function(err) {
			if (err) throw err;
			console.log('file saved');
		})
	});
}
