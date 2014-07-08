/* ------------------
 * Helper Application
 * ------------------
 * 
 * This application must run on the user's computer. It creates a local proxy
 * server at 127.0.0.1 (port 8080) which must be entered in proxy settings.
 * Once this is run, any proxy request it receives is relayed to a Web Proxy
 * server. Response from this external server is then received by the local, 
 * proxy server, which then delivers it to the requesting application as a
 * reponse to the application's request.
 *
 * Usage:
 * 1. Install Node.js, a javascript-based server platform.
 * 2. Make sure config/helper.json is present (settings).
 * 2. Open a Command Prompt in this folder and enter:
 *		> node helper.js
 * 3. Now configure your browser / application with proxy settings:
 *		server address: 127.0.0.1
 *		server port: 80
 * 4. Its done. Time to test.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


// dependencies
var fs = require('fs');
var http = require('http');


// initialization
var app = {};
var config = {};


// application status
var status = {
	'client': {
		'request': 0,
		'response': 0
	},
	'proxy': {
		'request': 0,
		'response': 0
	},
	'pending': 0
};


// root web page
app.sendText = function(res, txt) {
	res.writeHead(200, {'content-type': 'text/plain'});
	res.end(txt);
};


// shows root page if required (true)
app.showRoot = function(req, res) {
	if(req.url.indexOf('127.0.0.1') < 0) return false;
	console.log('Root page accessed.');
	var txt =
	'Client\n-------\n'+
	'Request:  '+status.client.request+'.\n'+
	'Response: '+status.client.response+'.\n\n'+
	'Proxy\n--------\n'+
	'Request:  '+status.proxy.request+'.\n'+
	'Response: '+status.proxy.response+'.\n\n'+
	'Pending:  '+status.pending+'.\n';
	app.sendText(res, txt);
	return true;
}


// forward reponse to client
app.handleRes = function(id, res, pRes) {
	++status.proxy.response;
	var hdr = pRes.headers, sz = hdr['server'];
	hdr['server'] = config.remote.server;
	console.log('['+id+'] Proxy reply status: '+pRes.statusCode+', size: '+sz+'.');
	if(hdr['connection']) hdr['proxy-connection'] = hdr['connection'];
	res.on('error', function() {
		console.log('['+id+'] Problem with response: '+err.message);
		res.abort();
	});
	res.writeHead(pRes.statusCode, hdr);
	res.removeHeader('connection');
	pRes.on('data', function(chunk) {
		res.write(chunk);
	});
	pRes.on('end', function() {
		// complete response to user
		if(pRes.trailers) res.addTrailers(pRes.trailers);
		console.log('['+id+'] Remote response complete');
		res.end(); 
		++status.client.response; --status.pending;
	});
}


// froward request from client
app.handleReq = function(req, res) {
	if(app.showRoot(req, res)) return;
	var id = ++status.client.request; ++status.pending;
	console.log('['+id+'] Local Request: '+req.url+'.');
	// prepare proxy request options
	var hdr = req.headers;
	hdr['user-agent'] = req.url;
	hdr['host'] = config.remote.host;
	if(hdr['proxy-connection']) hdr['connection'] = hdr['proxy-connection'];
	var options = {
		'method': req.method,
		'host': config.remote.host,
		'path': config.remote.path,
		'port': config.remote.port,
		'headers': hdr
	};
	// send proxy request
	var pReq = http.request(options, function (pRes) {
		app.handleRes(id, res, pRes);
	});
	pReq.removeHeader('proxy-connection');
	pReq.on('error', function(err) {
		console.log('['+id+'] Problem with request: '+err.message+'.');
		pReq.abort(); res.writeHead(500); res.end();
	});
	req.on('data', function(chunk) {
		pReq.write(chunk);
	});
	req.on('end', function() {
		++status.proxy.request;
		if(req.trailers) pReq.addTrailers(req.trailers);
		pReq.end();
		console.log('['+id+'] Proxy Request complete.');
	});
}


// create proxy helper server on preferred port
fs.readFile('config/helper.json', function(err, data) {
	config = JSON.parse(data);
	http.createServer(app.handleReq).listen(config.local.port);
	console.log('Proxy helper started on port '+config.local.port+'.');
});
