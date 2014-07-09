/* -----
 * Proxy
 * -----
 * 
 * Provides an HTTP Proxy (without routing) along with its monitoring.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


// dependencies
var url  = require('url');
var http = require('http');
var tank     = require('./tank')();
var config   = require('./config')();
var objbuild = require('./objbuild')();


module.exports = function(dep, inj) {
	// initialize
	var o = {};
	var log = dep.log;
	try      { o.maxLen = dep.maxLen; }
	catch(e) { o.maxLen = 32; }



	// proxy status
	o.status = {
		'client': {
			'request':  0,
			'response': 0
		},
		'proxy': {
			'request':  0,
			'response': 0
		},
		'pending': 0,
		'failed':  0
	};



	// proxy history
	o.history = {
		'client': {
			'request':  [],
			'response': []
		},
		'proxy': {
			'request':  [],
			'response': []
		},
		'pending': [],
		'failed':  []
	};



	// proxy running record
	o.record = {
		'active': [],
		'failed': []
	};

	
	
	// record client request
	o.recClientReq = function(req) {
		var rAct = o.record.active;
		var id = ++o.status.client.request; ++o.status.pending;
		if (rAct.length >= 32 && rAct[0].proxy.response === null) {
			--o.status.pending; ++o.status.failed;
			tank.add(o.record.failed, rAct[0]);
		}
		tank.add(rAct, {
			'id': id,
			'client': {
				'request': {
					'time': process.hrtime()[0],
					'method': req.method,
					'headers': objbuild.copy([req.headers]),
					'version': req.httpVersion,
					'trailers': req.trailers
				},
				'response': null
			},
			'proxy': {
				'request': null,
				'response': null
			}
		});
		return id;
	};


	// record proxy request
	o.recProxyReq = function(id, req) {
		var rAct = o.record.active;
		++o.status.proxy.request;
		for (var i = 0; i < rAct.length; i++) {
			if (rAct[i].id !== id) continue;
			rAct[i].proxy.request = {
				'time': process.hrtime()[0],
				'method': req.method,
				'headers': objbuild.copy([req.headers]),
				'version': req.httpVersion,
				'trailers': req.trailers
			}; break;
		}
	};


	// record proxy response
	o.recProxyRes = function(id, res) {
		var rAct = o.record.active;
		++o.status.proxy.response;
		for (var i = 0; i < rAct.length; i++) {
			if (rAct[i].id !== id) continue;
			rAct[i].proxy.response = {
				'time': process.hrtime()[0],
				'status': res.statusCode,
				'headers': objbuild.copy([res.headers]),
				'version': res.httpVersion,
				'trailers': res.trailers
			}; break;
		}
	};


	// record client response
	o.recClientRes = function(id, res) {
		var rAct = o.record.active;
		++o.status.client.response; --o.status.pending;
		for (var i = 0; i < rAct.length; i++) {
			if (rAct[i].id !== id) continue;
			rAct[i].client.response = {
				'time': process.hrtime()[0],
				'status': res.statusCode,
				'headers': objbuild.copy([res.headers]),
				'version': res.httpVersion,
				'trailers': res.trailers
			}; break;
		}
	};


	// update proxy history
	o.updateHistory = function() {
		var hReq = o.history.request, hRes = o.history.response;
		var sReq = o.status.request, sRes = o.status.response;
		tank.add(o.history.client.request, o.status.client.request);
		tank.add(o.history.client.response, o.status.client.response);
		tank.add(o.history.proxy.request, o.status.proxy.request);
		tank.add(o.history.proxy.response, o.status.proxy.response);
		tank.add(o.history.pending, o.status.pending);
		tank.add(o.history.failed, o.status.failed);
	};


	// handle response from server
	o.handleRes = function(id, res, pRes) {
		// tweak content-length
		o.recProxyRes(id, pRes);
		var hdr = pRes.headers;
		log.write('['+id+'] Response to Proxy started.');
		hdr['server'] = hdr['content-length'];
		hdr['transfer-encoding'] = 'chunked';
		// hdr['connection'] = 'keep-alive';
		hdr['content-length'] = '0';
		res.on('error', function(err) {
			log.write('['+id+'] Error with response to Client: '+err.message+'.');
			res.end();
		});
		res.writeHead(pRes.statusCode, hdr);
		pRes.on('error', function(err) {
			log.write('['+id+'] Error with response to Proxy: '+err.message+'.');
			res.send(500);
		});
		pRes.on('data', function(chunk) {
			res.write(chunk);
		});
		pRes.on('end', function() {
			if (pRes.trailers) res.addTrailers(pRes.trailers);
			log.write('['+id+'] Response to Client complete.');
			res.end(); o.recClientRes(id, {
				'statusCode': pRes.statusCode,
				'headers': hdr,
				'httpVersion': pRes.httpVersion,
				'trailers': pRes.trailers
			});
		});
	};


	// handle request from client
	o.handleReq = function(req, res) {
		// prepare remote request options
		var id = o.recClientReq(req);
		var hdr = req.headers;
		var addr = url.parse(hdr['user-agent']);
		hdr['user-agent'] = config.usrAgent;
		hdr['host'] = addr.host;
		var options = {
			'method': req.method,
			'hostname': addr.hostname,
			'auth': addr.auth,
			'port': addr.port,
			'path': addr.path+(addr.hash || ''),
			'headers': hdr
		};
		log.write('['+id+'] Request address to Proxy: '+addr.href+'.');
		req.on('error', function(err) {
			log.write('['+id+'] Problem with Client request: '+err.message+'.');
			res.send(500);
		});
		var pReq = http.request(options, function(pRes) {
			o.handleRes(id, res, pRes);
		});
		pReq.on('error', function(err) {
			log.write('['+id+'] Problem with Proxy request: '+err.message+'.');
			res.send(500);
		});
		req.on('data', function(chunk) {
			pReq.write(chunk);
		});
		req.on('end', function() {
			if (req.trailers) pReq.addTrailers(req.trailers);
			log.write('['+id+'] Proxy Request complete.');
			pReq.end(); o.recProxyReq(id, {
				'method': req.method,
				'headers': hdr,
				'httpVersion': req.httpVersion,
				'trailers':req.trailers
			});
		});
	};


	// return
	if(typeof inj !== 'undefined') {
		inj.status = o.status;
		inj.history = o.history;
		inj.record = o.record;
	}
	return o;
};