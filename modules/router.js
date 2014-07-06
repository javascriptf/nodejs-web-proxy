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
 * -----------
 * Web Routing
 * -----------
 * 
 * File: app-route.js
 * Project: Web Proxy
 * 
 * Routes a request path to appropriate handler.
 * 
 */


module.exports = function(inj) {
	

	// fetch dependencies
	var log = inj.log;
	var web = inj.router;
	var app = inj.code;
	var api = app.api;


	// root web page
	web.get('/', function(req, res) {
		log.add('Root Web Page accessed.');
		app.sendHtml(res, 'assets/html/index.html');
	});


	// status web page
	web.get('/status', function(req, res) {
		log.add('Status Web page accessed.');
		app.sendHtml(res, 'assets/html/status.html');
	});


	// data api access
	web.get('/api/data', function(req, res) {
		log.add('Data API accessed.');
		api.onDataReq(req, res);
	});

	
	// proxy access
	web.all('/proxy', function(req, res) {
		log.add('Proxy accessed.');
		app.proxy.handleReq(req, res);
	});


	return inj;
};
