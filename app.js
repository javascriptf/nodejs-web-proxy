// ----------------
// Required Modules
// ----------------
var fs = require('fs');
var os = require('os');
var url = require('url');
var express = require('express');


var appLog = require('./modules/app-log.js');
var appColl = require('./modules/app-coll.js');
var appSend = require('./modules/app-config.js');
var appConfig = require('./modules/app-config.js');

var web = express();

var app = {};
appLog(app);
appColl(app);
appSend(app);
appConfig(app);



// --------
// App Info
// --------



// update runtime info
app.updateRuntime = function() {
	app.updateRuntimeSystem();
	app.updateRuntimeProcess();
	app.updateRuntimeProxy();
};



// ---------
// Proxy API
// ---------

// process proxy request
web.all('/proxy', function(req, res) {

});



// -------
// Web API
// -------

// get app config
web.get('/api/config', function(req, res) {
	log.add('Config API accessed.');
	app.sendJson(res, app.config);
});

// read current log
web.get('/api/log', function(req, res) {
	log.add('Log API accessed.');
	app.sendJson(res, log.data);
});

// get system info
web.get('/api/system', function(req, res) {
	app.updateSystem();
	log.add('System API accessed.');
	app.sendJson(res, app.system);
});

// get process info
web.get('/api/process', function(req, res) {
	app.updateProcess();
	log.add('Process API accessed.');
	app.sendJson(res, app.process);
});

// get proxy info
web.get('/api/proxy', function(req, res) {
	log.add('Proxy API accessed.');
	app.sendJson(res, app.proxy);
});

// get runtime info
web.get('/api/runtime', function(req, res) {
	log.add('Runtime API accessed.');
	app.sendJson(res, app.runtime);
});

// get runtime[system] info
web.get('/api/runtime/system', function(req, res) {
	log.add('Runtime[system] API accessed.');
	app.sendJson(res, app.runtime.system);
});

// get runtime[process] info
web.get('/api/runtime/process', function(req, res) {
	log.add('Runtime[process] API accessed.');
	app.sendJson(res, app.runtime.process);
});

// get runtime[proxy] info
web.get('/api/runtime/proxy', function(req, res) {
	log.add('Runtime[proxy] API accessed.');
	app.sendJson(res, app.runtime.proxy)
});

// get runtime[proxy][rate] info
web.get('/api/runtime/proxy/rate', function(req, res) {
	log.add('Runtime[proxy][rate] API accessed.');
	app.sendJson(res, app.runtime.proxy.rate);
});

// get runtime[proxy][active] info
web.get('/api/runtime/proxy/active', function(req, res) {
	log.add('Runtime[proxy][active] API accessed.');
	app.sendJson(res, app.runtime.proxy.active);
});

// get runtime[proxy][failed] info
web.get('/api/runtime/proxy/failed', function(req, res) {
	log.add('Runtime[proxy][failed] API accessed.');
	app.sendJson(res, app.runtime.proxy.failed);
});

// get headers
web.get('/api/headers', function(req, res) {
	log.add('Headers API accessed.');
	app.sendJson(res, req.headers);
});



// ---------------
// Web Page Access
// ---------------

// root web page
web.get('/', function(req, res) {
	log.add('Root Web Page accessed.');
	app.sendHtml(res, 'assets/html/index.html');
});

// status web page
web.get('/status', function(req, res) {
	log.add('Status Web page accessed');
	app.sendHtml(res, 'assets/html/status.html');
})

// static files
web.use(express.static(__dirname + '/assets'));

// wrong path
web.use(function(req, res, next) {
	log.add('Wrong Path['+req.url+'] accessed.');
	app.sendHtml(res, 'assets/html/404.html');
});



// ------------------
// Create HTTP Server
// ------------------
var server = web.listen(app.config.port, function() {
	log.add('Proxy started on port '+app.config.port+'.');
	setInterval(function() {
		app.updateRuntime();
		app.updateProxy();
	}, 5*60*1000);
});
