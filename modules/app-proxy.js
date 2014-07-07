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
var url = require('url');
var http = require('http');
var tank = require('./tank')();
var config = require('./config')();
var objbuild = require('./objbuild')();


module.exports = function(dep, inj) {
	// initialize
	var o = {};
	var log = dep.log;


	// proxy status
	o.status = {
		'client': {
			'request': 0,
			'response': 0
		}
		'proxy': {
			'request': 0,
			'response': 0
		},
		'pending': 0,
		'failed': 0
	};


	// proxy history
	o.history = {
		'client': {
			'request': [],
			'response': []
		}
		'proxy': {
			'request': [],
			'response': []
		},
		'pending': [],
		'failed': []
	};


	// proxy running record
	o.record = {
		'active': [],
		'failed': []
	};
	
	
	// record client request
	o.recClientReq = function(req) {
		var rAct = o.record.active;
		var id = ++o.client.request; ++o.status.pending;
		if (rAct.length >= 32 && rAct[0].response.proxy === null) {
			--o.status.pending; ++o.status.failed;
			tank.add(o.record.failed, rAct[0]);
		}
		tank.add(rAct, {
			'id': id,
			'client': {
				'request': {
					'time': process.hrtime()[0],
					'method': req.method,
					'headers': obj.copy([req.headers]),
					'version': req.httpVersion,
					'trailers': req.trailers,
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
		for (var i = 0; i < rAct.length; i++) {
			if (rAct[i].id !== id) continue;
			rAct[i].request.complete = true;
			break;
		}
	};


	// record begining of a proxy response
	o.recResBegin = function(id, res) {
		var sReq = o.status.request;
		var sRes = o.status.response;
		var rAct = o.record.active;
		--sReq.pending; ++sRes.total;
		for (var i = 0; i < rAct.length; i++) {
			if (rAct[i].id !== id) continue;
			rAct[i].response = {
				'time': process.hrtime()[0],
				'status': res.statusCode,
				'headers': obj.copy([res.headers]),
				'version': res.httpVersion,
				'trailers': res.trailers,
				'complete': false
			};
		}
	};


	// record ending of a proxy response
	o.recResEnd = function(id) {
		var rAct = o.record.active;
		for (var i = 0; i < rAct.length; i++) {
			if (rAct[i].id !== id) continue;
			rAct[i].response.complete = true;
			break;
		}
	};


	// update proxy history
	o.updateHistory = function() {
		var hReq = o.history.request, hRes = o.history.response;
		var sReq = o.status.request, sRes = o.status.response;
		tank.add(hReq.total, sReq.total);
		tank.add(hReq.failed, sReq.failed);
		tank.add(hReq.pending, sReq.pending);
		tank.add(hRes.total, sRes.total);
	};


	// handle response from server
	o.handleRes = function(id, res, sRes) {
		// tweak content-length
		o.recResBegin(id, sRes);
		var sHdr = sRes.headers;
		sHdr['server'] = sHdr['content-length'];
		sHdr['transfer-encoding'] = 'chunked';
		// sHdr['connection'] = 'keep-alive';
		sHdr['content-length'] = 0;
		log.write('['+id+'] Server Proxy Response started.');
		res.writeHead(sRes.statusCode, sHdr);
		sRes.on('error', function(e) {
			res.writeHead(400, {'retry-after': 2});
			res.end();
		})
		sRes.on('data', function(chunk) {
			res.write(chunk);
		});
		sRes.on('end', function() {
			if (sRes.trailers != null) res.addTrailers(sRes.trailers);
			res.end();
			inj.code.recEndResponse(id);
			log.add('[' + id + '] Server Proxy Response complete.');
		});
	};


	// handle request from user
	o.handleReq = function(req, res) {
		// handle error in request
		var err = null;
		req.on('error', function(e) {
			err = e; res.end();
		});
		// prepare remote request options
		var id = o.recReqBegin(req);
		var hdr = req.headers;
		var addr = url.parse(hdr['user-agent']);
		hdr['user-agent'] = config.usrAgent;
		hdr['host'] = host;
		var options = {
			'method': req.method,
			'hostname': addr.hostname,
			'auth': addr.auth,
			'port': addr.port,
			'path': addr.path+addr.hash,
			'headers': hReq
		};
		log.write('['+id+'] Request address to Proxy: '+addr.href+'.');
		var sReq = http.request(options, function(sRes) {
			o.handleRes(id, res, sRes);
		});
		sReq.on('error', function(err) {
			log.write('['+id+'] Problem with proxy request: '+err.message+'.');
		});
		req.on('data', function(chunk) {
			sReq.write(chunk);
		});
		req.on('end', function() {
			if (req.trailers !== null) sReq.addTrailers(req.trailers);
			sReq.end(); o.recReqEnd(id);
			log.write('[' + id + '] Server Proxy Request complete.');
		});
	};


	// return
	if(typeof inj != 'undefined') {
		inj.status = o.status;
		inj.history = o.history;
		inj.record = o.record;
	}
	return o;
};