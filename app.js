// required modules
var express = require('express');
var app = express();

var apiOs = require("code/apiOs.js");
var apiLog = require('code/apiLog.js');
var apiRoot = require('code/apiRoot.js');
var apiProxy = require('code/apiProxy.js')


// settings
var usrAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/21.0';
var port = process.env.PORT || 80;


// information
var appName = 'web_Proxy';
var reqUrls = appLog();
var log = appLog();


// setup modules
apiOs.log = log;
apiRoot.log = log;
apiProxy.log = log;
apiProcess.log = log;

appOs.log = log;
appProcess.log = log;


// routing
app.get('/', function(req, res) { apiRoot.page(reg, res); });
app.get('/proxy', function(req, res) { apiProxy.page(req, res); });
app.get('/log/read', function(req, res) { apiLog.read(req, res); });
app.get('/os/info', function(req, res) { apiOs.info(req, res); });
app.get('/os/memoryusage', function(req, res) { apiOs.memoryUsage(req, res); });
app.get('/os/runtime', function(req, res) { apiOs.runTime(req, res); });
app.get('/process/info', function(req, res) { apiProcess.info(req, res); });
app.get('/process/memoryusage', function(req, res) { apiProcess.memoryUsage(req, res); });
app.get('/process/runtime', function(req, res) { apiProcess.runTime(req, res); });
// static files
app.use('/assets', express.static(__dirname + '/assets'));
// on wrong path
app.use(function(req, res, next) {
  res.send(404, 'Something broke!');
});


// create http server
var server = app.listen(port, function() {
	console.log('Proxy started on port ' + port);
});
