/*test string similarity*/
/*
var stringSimilarity = require('string-similarity');
var p = "Miami/Fort Lauderdale Area - ‎Director of E-Commerce at J.R. Dunn Jewelers - ‎J.R. Dunn Jewelers".toLowerCase()
console.log(p)
console.log(p.indexOf('commerce')>-1);
console.log(p.substring(p.lastIndexOf('-')+3).replace(/\./g, ''));
console.log(stringSimilarity.compareTwoStrings(p.substring(p.lastIndexOf('-')+3).replace(/\./g, ''),"jrdunn"))
*/
/*test wappalyzer*/
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
