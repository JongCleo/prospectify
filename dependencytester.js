/*test string similarity*/
/*
var stringSimilarity = require('string-similarity');
var p = "Miami/Fort Lauderdale Area - ‎Director of E-Commerce at J.R. Dunn Jewelers - ‎J.R. Dunn Jewelers".toLowerCase()
console.log(p)
console.log(p.indexOf('commerce')>-1);
console.log(p.substring(p.lastIndexOf('-')+3).replace(/\./g, ''));
console.log(stringSimilarity.compareTwoStrings(p.substring(p.lastIndexOf('-')+3).replace(/\./g, ''),"jrdunn"))
*/



/*test wappalyzer
var wappalyzer = require("wappalyzer");
var platformList = ['Magento',"Shopify","WooCommerce","Demandware","PrestaShop","OpenCart","Bigcommerce","Volusion","Zen Cart"];

var options=
  { url: 'http://www.babycottons.com/',
    hostname: 'babycottons.com',
    debug: false }



wappalyzer.detectFromUrl(options, function(err,apps,appInfo){

  console.dir(apps)

  for (var i =0; i<apps.length; i++){
    if(platformList.indexOf(apps[i]) >= 0){

      console.log("platform is: "+apps[i]);
      break;
    }
  }
})
*/

/*test blockspring*/
var blockspring = require("blockspring");
var BING_KEY ='bb913bdbb2d5f13ad3c8cd488448c795'

blockspring.runParsed("web-search-top-bing",
{ "search_query": , "market": , "adult": , "latitude": null, "longitude": null, "host_only": false }, { api_key: "br_35635_aa6ed22e7878dc981ea7c1e138a24c92e58183bc"}, function(res) {
  console.log(res.params);
});

blockspring.runParsed("web-search-top-result-bing",
{
  "search_query": "designerscentralstore",
  "host_only": false
},
{
 api_key: BING_KEY
},
function(domainRes) {
  if(domainRes.params.results){
    console.log("Domain results"+ domainRes.params.results.replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0]);
  }
  else{
    console.log(domainRes)
  }

})
