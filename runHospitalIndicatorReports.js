//// https://livecodestream.dev/post/convert-web-pages-into-pdfs-with-puppeteer-and-nodejs/
const fs = require('fs');
const puppeteer = require("puppeteer");
const zipdir = require('zip-dir');



var runrep = async function(browser, hos, ind) {
	try {
		console.log("Tried:", hos, ind);
		var url = "http://cahvis/indicator-download/"+hos+"?accesscode="+accesscode+"&indicator="+ind;		
		console.log(url);
		var hpath = savepath+"/"+hos;
		if (!fs.existsSync(hpath)){
		    fs.mkdirSync(hpath);
		}
		var fn = hpath+"/"+ind+".pdf";
		const webPage = await browser.newPage();
//		await webPage.waitForTimeout(3000);
		await webPage.goto(url, {
		    waitUntil: "networkidle0"
		});
		await webPage.pdf({
		    printBackground: true,
		    path: fn,
		    format: "Letter",
		    margin: {
		        top: "20px",
		        bottom: "40px",
		        left: "20px",
		        right: "20px"
		    }
		});
		console.log("Saved:", hos, ind);
	} catch(er) {
		console.log(er);
	}
};



var done = 0;
var runone = async function(browser) {
	if (hikeys.length > 0) {
		var hikey = hikeys.pop();
		await runrep(browser, hikey.hospital, hikey.indicator);
		runone(browser);
	} else {
		browser.close();
		done++;
		if (done >= threadcount) {
			//// JETWEEDY
			//// Here we should zip things up if they're done.
			zipdir(savepath, { saveTo: rootpath+'/hospital-indicator-reports.zip' }, function (err, buffer) {
				//// and unlink that active.txt file so the unique code can't be used for any more logins
				fs.unlink(rootpath+'/active.txt', (err)=>{});
			});
		}
	}
}


var runme = async function() {
	for ( var i=0 ; i<threadcount ; i++ ) {
		var browser = await puppeteer.launch();
		runone(browser, accesscode);	// increment number of threads and launch one off
	}
};



//// -------------------------------------------------------------------------------
//// JETWEEDY
//// -------------------------------------------------------------------------------
//// Get these variables from args passed into the command instead.
//// -------------------------------------------------------------------------------
//// node runHospitalIndicatorReports.js 162205300560ae908d399ea AK001,AK002 opmarg,totmarg
//// -------------------------------------------------------------------------------

var accesscode = process.argv[2];
var hospitals = process.argv[3].split(",");
var indicators = process.argv[4].split(",");

//// -------------------------------------------------------------------------------

var threadcount = 10;
var rootpath = "/var/www/html/cahvis/storage/app/uuids/"+accesscode
var savepath = rootpath+"/reports";
if (!fs.existsSync(savepath)){
    fs.mkdirSync(savepath);
}

var hikeys = [];
for (var h=0;h<hospitals.length;h++) {
	for (var i=0;i<indicators.length;i++) {
		hikeys.push({
			"hospital":hospitals[h]
			, 
			"indicator":indicators[i]
		});
	}
}
runme();







