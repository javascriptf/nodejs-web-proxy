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



// datastore
var app 	= {};
var config 	= {};



// dependencies
var fs 		= require('fs');
var http 	= require('http');



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



// send text data as response
app.sendText = function(res, txt) {
	res.writeHead(200, {'content-type': 'text/plain'});
	res.end(txt);
};



// shows root page if required (true)
app.showRoot = function(req, res) {

	// if root page not requested, then return
	if(req.url.indexOf('127.0.0.1') < 0) return false;
	
	// log access to root page
	console.log('Root page accessed.');
	
	// generate text reply
	var txt =
	'Client\n-------\n'+
	'Request:  '+status.client.request+'.\n'+
	'Response: '+status.client.response+'.\n\n'+
	'Proxy\n--------\n'+
	'Request:  '+status.proxy.request+'.\n'+
	'Response: '+status.proxy.response+'.\n\n'+
	'Pending:  '+status.pending+'.\n';

	// send text, root accessed = true
	app.sendText(res, txt);
	return true;
};



// forward reponse to client
app.handleRes = function(id, res, pRes) {

	// update status
	++status.proxy.response;
	
	// get proxy response headers
	var hdr = pRes.headers;

	// get content-length from server header
	var sz = hdr['server'];

	// set server header to a standard name
	hdr['server'] = config.remote.server;

	// log response status code and content-length
	console.log('['+id+'] Proxy response status: '+pRes.statusCode+', size: '+sz+'.');
	
	// set proxy-connection header from connection header
	if(hdr['connection']) hdr['proxy-connection'] = hdr['connection'];
	
	// handle error with response (maybe disconnect)
	res.on('error', function() {
		console.log('['+id+'] Problem with response: '+err.message);
		res.abort();
	});

	// write client response headers
	res.writeHead(pRes.statusCode, hdr);
	
	// remove bad headers
	res.removeHeader('connection');
	
	// stream proxy data to client
	pRes.on('data', function(chunk) {
		res.write(chunk);
	});

	// handle end of response
	pRes.on('end', function() {
		
		// send trailers if available
		if(pRes.trailers) res.addTrailers(pRes.trailers);
		
		// load and end response to client
		console.log('['+id+'] Remote response complete');
		res.end(); 

		// update status
		++status.client.response;
		--status.pending;
	});
};



// forward request from client
app.handleReq = function(req, res) {

	// show root page is requested
	if(app.showRoot(req, res)) return;

	// get request id, update status
	var id = ++status.client.request;
	++status.pending;

	// log request url
	console.log('['+id+'] Local Request: '+req.url+'.');

	// get request headers
	var hdr = req.headers;

	// let user-agent store the request url
	hdr['user-agent'] = req.url;

	// set host to the proxy host address
	hdr['host'] = config.remote.host;

	// set connection header from proxy-connection header
	if(hdr['proxy-connection']) hdr['connection'] = hdr['proxy-connection'];

	// prepare request options
	var options = {
		'method': req.method,
		'host': config.remote.host,
		'path': config.remote.path,
		'port': config.remote.port,
		'headers': hdr
	};
	
	// send request to proxy
	var pReq = http.request(options, function (pRes) {
		app.handleRes(id, res, pRes);
	});

	// remove bad headers
	pReq.removeHeader('proxy-connection');
	
	// handle error with request
	pReq.on('error', function(err) {
		console.log('['+id+'] Problem with request: '+err.message+'.');
		pReq.abort();
		res.writeHead(500);
		res.end();
	});

	// stream client request data to proxy
	req.on('data', function(chunk) {
		pReq.write(chunk);
	});

	// handle end of request
	req.on('end', function() {
		
		// send trailers if available
		if(req.trailers) pReq.addTrailers(req.trailers);

		// log and end request to proxy
		console.log('['+id+'] Proxy Request complete.');
		pReq.end();

		// update status
		++status.proxy.request;
	});
};



// create proxy helper server on preferred port
fs.readFile('config/helper.json', function(err, data) {

	// read config from helper.json
	config = JSON.parse(data);

	// create http server on configured port
	http.createServer(app.handleReq).listen(config.local.port);
	console.log('Proxy helper started on port '+config.local.port+'.');
});
