// dependencies
var fs = require('fs');
var net = require('net');
var http = require('http');
var crypto = require('crypto');



// initialize
var o = {};
o.id = 0;
o.host = 'www.gmodules.com';
o.pathPrefix = '/ig/proxy?url=';
o.pfx = 'config/localhost.pfx';



// forward reponse to client
o.onRes = function(id, pRes, res) {
	
	// get proxy response headers
	var hdr = pRes.headers;
	console.log('['+id+'] Proxy response status: '+pRes.statusCode+'.');
	if(hdr['connection']) {
		hdr['proxy-connection'] = hdr['connection'];
		delete hdr['connection'];
	}
	if(hdr['content-disposition']) delete hdr['content-disposition'];
	if(hdr['x-content-type-options']) delete hdr['x-content-type-options'];
	
	// handle error with response (maybe disconnect)
	res.on('error', function() {
		console.log('['+id+'] Problem with response: '+err.message+'.');
		res.abort();
	});
	
	// write client response headers
	res.writeHead(pRes.statusCode, hdr);
	
	// stream proxy data to client
	pRes.on('data', function(chunk) {
		res.write(chunk);
	});
	
	// end, send trailers if available
	pRes.on('end', function() {
		if(pRes.trailers) res.addTrailers(pRes.trailers);
		console.log('['+id+'] Remote response complete.');
		res.end(); 
	});
};



// handle request
o.onReq = function(req, res) {
	
	// prepare request
	var id = o.id++;
	var hdr = req.headers;
	if(hdr['proxy-connection']) {
		hdr['connection'] = hdr['proxy-connection'];
		delete hdr['proxy-connection'];
	}
	hdr['host'] = o.host;
	var options = {
		'method': req.method,
		'host': o.host,
		'path': o.pathPrefix+req.url,
		'port': 80,
		'headers': hdr
	};
	console.log('['+id+'] Request: '+req.url+'.');

	// send request to gmodules
	var pReq = http.request(options, function(pRes) {
		o.onRes(id, pRes, res);
	});
	
	// handle error with request
	pReq.on('error', function(err) {
		console.log('['+id+'] Problem with request: '+err.message+'.');
		pReq.abort();
		res.writeHead(500);
		res.end();
	});

	// stream request data to gmodules
	req.on('data', function(chunk) {
		pReq.write(chunk);
	});

	// end, send trailers if available
	req.on('end', function() {
		if(req.trailers) pReq.addTrailers(req.trailers);
		console.log('['+id+'] Proxy Request complete.');
		pReq.end();
	});
};



// create proxy server
http.createServer(o.onReq).listen(8080);
console.log('GModules Proxy started on 127.0.0.1:8080.');

