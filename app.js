/* ----------------------------------------------------------------------- *
 *
 *	 Copyright (c) 2014, Subhajit Sahu
 *	 All rights reserved.
 *
 *   Redistribution and use in source and binary forms, with or without
 *   modification, are permitted provided that the following
 *   conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above
 *     copyright notice, this list of conditions and the following
 *     disclaimer in the documentation and/or other materials provided
 *     with the distribution.
 *
 *     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
 *     CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
 *     INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 *     MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *     DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 *     CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 *     SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *     NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 *     LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 *     HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *     CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 *     OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 *     EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ----------------------------------------------------------------------- */

/* 
 * ----------------
 * Main Application
 * ----------------
 * 
 * File: app.js
 * Project: Web Proxy
 * 
 * This is the main application file.
 * 
 */


// required modules
var express = require('express');

var mLog = require('./modules/app-log.js');
var mApi = require('./modules/app-api.js');
var mSend = require('./modules/app-send.js');
var mProxy = require('./modules/app-proxy.js');
var mRoute = require('./modules/app-route.js');
var mConfig = require('./modules/app-config.js');
var mSystem = require('./modules/app-system.js');
var mProcess = require('./modules/app-process.js');


// inlitialize modules
var web = express();
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


// Static files
web.use(express.static(__dirname + '/assets'));


// Wrong path
web.use(function(req, res, next) {
	log.add('Wrong Path['+req.url+'] accessed.');
	app.sendHtml(res, 'assets/html/404.html');
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
