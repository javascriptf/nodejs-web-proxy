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
var httpio = require('./httpio');


module.exports = function(dep, inj) {
	// initialize
	var io = httpio();
	var web = express();
	var log = dep.log;
	var api = dep.api;
	var proxy = dep.proxy;
	var staticDir = dep.staticDir;


	// root web page
	web.get('/', function(req, res) {
		log.write('Root Web Page accessed.');
		io.writeHtml(res, 'assets/html/index.html');
	});


	// status web page
	web.get('/status', function(req, res) {
		log.write('Status Web page accessed.');
		io.writeHtml(res, 'assets/html/status.html');
	});


	// get request headers and data
	web.all('/api/request', function(req, res) {
		var reqMsg = io.readJson(req);
		reqMsg.on('end' );
		'method': req.method,
		'host': host,
		'path': addr,
		'headers': hReq
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
		io.writeHtml(res, 'assets/html/404.html');
	});


	// return
	return web;
};
