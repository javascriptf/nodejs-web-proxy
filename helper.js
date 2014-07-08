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
	'Request\n-------\n'+
	'Total: '+status.request.total+'.\n'+
	'Pending: '+status.request.pending+'.\n\n'+
	'Response\n--------\n'+
	'Total: '+status.response.total+'.\n\n';
	app.sendText(res, txt);
	return true;
}


// forward reponse to requester
app.handleRes = function(id, res, sRes) {
	// begin reponse to user
	console.log('['+id+'] Proxy reply status: '+sRes.statusCode);
	var sHdr = sRes.headers;
	sHdr['content-length'] = sHdr['server'];
	sHdr['server'] = config.remote.server;
	sHdr['proxy-connection'] = sHdr['connection'];
	res.writeHead(sRes.statusCode, sHdr);
	sRes.on('data', function(chunk) {
		res.write(chunk);
	});
	sRes.on('end', function() {
		// complete response to user
		if(sRes.trailers != null) res.addTrailers(sRes.trailers);
		res.end();
		// record reponse completion
		console.log('['+id+'] Remote response complete');
		++status.response.total;
		--status.request.pending;
	});
}


// froward request from user
app.handleReq = function(req, res) {
	if(app.showRoot(req, res)) return;
	// record a new request
	var id = ++status.request.total;
	++status.request.pending;
	console.log('['+id+'] Local Request: '+req.url+'.');
	// prepare options for the proxy
	var hdr = req.headers;
	hdr['host'] = config.remote.host;
	hdr['user-agent'] = req.url;
	hdr['connection'] = hdr['proxy-connection'];
	var options = {
		'method': req.method,
		'host': config.remote.host,
		'path': config.remote.path,
		'port': config.remote.port,
		'headers': hdr
	};
	// send request to remote proxy
	var sReq = http.request(options, function (sRes) {
		app.handleRes(id, res, sRes);
	});
	sReq.removeHeader('proxy-connection');
	sReq.on('error', function(err) {
		console.log('['+id+'] Problem with request: '+err.message);
	});
	req.on('data', function(chunk) {
		sReq.write(chunk);
	});
	req.on('end', function() {
		if(req.trailers !== null) sReq.addTrailers(req.trailers);
		sReq.end();
		console.log('['+id+'] Proxy Request complete.');
	});
}


// create proxy helper server on preferred port
fs.readFile('config/helper.json', function(err, data) {
	config = JSON.parse(data);
	http.createServer(app.handleReq).listen(config.local.port);
	console.log('Proxy helper started on port '+config.local.port+'.');
});
