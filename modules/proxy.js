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
var obj = require('./obj')();
var tank = require('./tank')();
var config = require('./config')();


module.exports = function(dep, inj) {
	// initialize
	var o = {};
	var log = dep.log;


	// proxy status
	o.status = {
		'request': {
			'total': 0,
			'pending': 0,
			'failed': 0
		},
		'response': {
			'total': 0
		}
	};


	// proxy history
	o.history = {
		'request': {
			'total': [],
			'pending': [],
			'failed': []
		},
		'response': {
			'total': []
		}
	};


	// proxy running record
	o.record = {
		'active': [],
		'failed': []
	};
	
	
	// record begining of a proxy request
	o.recReqBegin = function(req) {
		var sReq = o.status.request;
		var rAct = o.record.active;
		var id = ++sReq.total; ++sReq.pending;
		var addr = req.headers['user-agent'];
		if (rAct.length >= 32 && rAct[0].response.complete === false) {
			--sReq.pending; ++sReq.failed;
			tank.add(o.record.failed, rAct[0]);
		}
		tank.add(rAct, {
			'id': id,
			'request': {
				'time': process.hrtime()[0],
				'addr': addr,
				'method': req.method,
				'headers': obj.copy([req.headers]),
				'version': req.httpVersion,
				'trailers': req.trailers,
				'complete': false
			},
			'response': {
				'complete': false
			}
		});
		return id;
	};


	// record ending of a proxy request
	o.recReqEnd = function(id) {
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
		inj.code.recBeginResponse(id, sRes);
		var sHdr = sRes.headers;
		sHdr['server'] = sHdr['content-length'];
		sHdr['transfer-encoding'] = 'chunked';
		sHdr['connection'] = 'keep-alive';
		sHdr['content-length'] = 0;
		log.add('[' + id + '] Server Proxy Response started.');
		res.writeHead(sRes.statusCode, sHdr);
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
		// prepare remote request options
		var id = inj.code.recBeginRequest(req);
		var hReq = req.headers;
		var addr = hReq['user-agent'];
		var host = url.parse(addr).host;
		hReq['user-agent'] = config.usrAgent;
		hReq['host'] = host;
		var options = {
			'method': req.method,
			'host': host,
			'path': addr,
			'headers': hReq
		};
		log.add('[' + id + '] Request is: ' + JSON.stringify(options));
		log.add('[' + id + '] Proxy Request to Server: ' + addr + '.');
		var sReq = http.request(options, function(sRes) {
			inj.code.handleRes(id, res, sRes);
		});
		sReq.on('error', function(err) {
			log.add('[' + id + '] Problem with proxy request: ' + err.message + '.');
		});
		req.on('data', function(chunk) {
			sReq.write(chunk);
		});
		req.on('end', function() {
			if (req.trailers !== null) sReq.addTrailers(req.trailers);
			sReq.end();
			inj.code.recEndRequest(id);
			log.add('[' + id + '] Server Proxy Request complete.');
		});
	};


	// inject data
	inj.status = o.status;
	inj.history = o.history;
	inj.record = o.record;
	return o;
};