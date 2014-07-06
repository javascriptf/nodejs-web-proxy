/* ----------------
 * Main Application
 * ----------------
 * 
 * This is the main application file.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


// load express
var express = require('express');
var web = express();

// load modules
var mLog = require('./modules/app-log.js');
var mApi = require('./modules/app-api.js');
var mSend = require('./modules/app-send.js');
var mProxy = require('./modules/app-proxy.js');
var mRoute = require('./modules/app-route.js');
var mConfig = require('./modules/app-config.js');
var mSystem = require('./modules/app-system.js');
var mProcess = require('./modules/app-process.js');


// inlitialize modules
var log = mLog({});
var config = mConfig({});


var app = {
	'data': {
		'log': log,
		'config': config,
		'process': {},
		'system': {},
		'proxy': {}
	},
	'process': {},
	'system': {},
	'proxy': {},
	'api': {}
};

mSend(app);
mProxy({
	'data': app.data.proxy,
	'code': app.proxy,
	'log': log
});
mSystem({
	'data': app.data.system,
	'code': app.system
});
mProcess({
	'data': app.data.process,
	'code': app.process
});
mApi({
	'log': log,
	'data': app.data,
	'code': app.api,
	'sender': app
});
mRoute({
	'log': log,
	'code': app,
	'router': web
});


// Create HTTP Server
var server = web.listen(config.port, function() {
	// log the start of server
	log.add('Proxy started on port '+config.port+'.');
	//  update status every 5s
	setInterval(function() {
		app.process.updateStatus();
		app.system.updateStatus();
	}, 5*1000);
	// update history every minute
	setInterval(function() {
		app.process.updateHistory();
		app.system.updateHistory();
		app.proxy.updateHistory();
	}, 60*1000);
});
