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


// dependencies
var log = require('./modules/logger')();
var config = require('./modules/config')();
var web = require('./modules/router')({'log': log, 'staticDir': __dirname+'/assets'});


/*
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
*/


// Create HTTP Server
var server = web.listen(config.port, function() {
	// log the start of server
	var abc = require('url').parse('safasd; asd');
	var kmn = {};
	kmn.x = null;
	if(kmn.x === null) log.write('Yes!');
	log.write('Proxy started on port '+config.port+'.'+JSON.stringify(abc));
	/*
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
	*/
});
