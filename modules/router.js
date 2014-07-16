/* -------------
 * Router (HTTP)
 * -------------
 * 
 * Routes a request path to appropriate handler.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


// dependencies
var express = require('express');


module.exports = function(dep, inj) {
	// initialize
	var web 	  = express();
	var log 	  = dep.log;
	var api 	  = dep.api;
	var proxy 	  = dep.proxy;
	var staticDir = dep.staticDir;


	// root web page
	web.get('/', function(req, res) {
		log.write('Root Web Page accessed.');
		res.sendfile('assets/html/index.html');
	});


	// status web page
	web.get('/status', function(req, res) {
		log.write('Status Web page accessed.');
		res.sendfile('assets/html/status.html');
	});


	// disclaimer page
	web.get('/disclaimer', function(req, res) {
		log.write('Disclaimer Web Page accessed.');
		res.sendfile('assets/html/disclaimer.html');
	});


	// getting started page
	web.get('/start', function(req, res) {
		log.write('Getting Started Web Page accessed.');
		res.sendfile('assets/html/getting-started.html');
	});


	// get request headers
	web.all('/api/request/headers', function(req, res) {
		log.write('Request [headers] API accessed.');
		res.json({
			'method': 	req.method,
			'addr': 	req.url,
			'headers': 	req.headers,
		});
	});


	// data api access
	web.get('/api/data', function(req, res) {
		log.write('Data API accessed.');
		api.onDataReq(req, res);
	});

	
	// proxy access
	web.all('/proxy', function(req, res) {
		log.write('Proxy accessed.');
		proxy.handleReq(req, res);
	});


	// static files
	web.use(express.static(staticDir));


	// wrong path
	web.use(function(req, res, next) {
		log.write('Wrong Path ['+req.url+'] accessed.');
		res.status(404).sendfile('assets/html/404.html');
	});


	// return
	return web;
};
