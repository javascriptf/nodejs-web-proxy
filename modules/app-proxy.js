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
 * ------------
 * Proxy Module
 * ------------
 * 
 * File: app-proxy.js
 * Project: Web Proxy
 * 
 * Provides an HTTP Proxy (without routing) along with its monitoring.
 * 
 */


// required modules
var url = require('url');
var http = require('http');
var mObj = require('./app-obj.js');
var mTank = require('./app-tank.js');
var mConfig = require('./app-config.js');

// initialize modules
var obj = mObj({});
var tank = mTank({});
var config = mConfig({});


module.exports = function(inj) {


	// proxy status
	var status = {
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
	var history = {
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
	var record = {
		'active': [],
		'failed': []
	};


	// inject data
	inj.data.status = status;
	inj.data.history = history;
	inj.data.record = record;
	var log = inj.log;


	// record begining of a proxy request
	inj.code.recBeginRequest = function(req) {
		++status.request.pending;
		var id = ++status.request.total;
		var addr = req.headers['user-agent'];
		if(record.active.length >= 32 &&
			record.active[0].response.complete === false) {
			--status.request.pending; ++status.request.failed;
			tank.add(record.failed, record.active[0]);
		}
		tank.add(record.active, {
			'id': id,
			'request': {
				'time': process.hrtime()[0],
				'addr': addr,
				'method': req.method,
				'headers': obj.copy(req.headers),
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
	inj.code.recEndRequest = function(id) {
		for(var i=0; i<record.active.length; i++) {
			if(record.active[i].id !== id) continue;
			record.active[i].request.complete = true;
			break;
		}
	};


	// record begining of a proxy response
	inj.code.recBeginResponse = function(id, res) {
		--status.request.pending;
		++status.response.total;
		for(var i=0; i<record.active.length; i++) {
			if(record.active[i].id !== id) continue;
			record.active[i].response = {
				'time': process.hrtime()[0],
				'status': res.statusCode,
				'headers': obj.copy(res.headers),
				'version': res.httpVersion,
				'trailers': res.trailers,
				'complete': false
			};
		}
	};


	// record ending of a proxy response
	inj.code.recEndResponse = function(id) {
		for(var i=0; i<record.active.length; i++) {
			if(record.active[i].id !== id) continue;
			record.active[i].response.complete = true;
		}
	};


	// update proxy history
	inj.code.updateHistory = function() {
		tank.add(history.request.total, status.request.total);
		tank.add(history.request.failed, status.request.failed);
		tank.add(history.request.pending, status.request.pending);
		tank.add(history.response.total, status.response.total);
	};


	// handle response from server
	inj.code.handleRes = function(id, res, sRes) {
		// tweak content-length
		inj.code.recBeginResponse(id, sRes);
		var sHdr = sRes.headers;
		sHdr['server'] = sHdr['content-length'];
		sHdr['transfer-encoding'] = 'chunked';
		sHdr['content-length'] = 0;
		log.add('['+id+'] Server Proxy Response started.');
		res.writeHead(sRes.statusCode, sHdr);
		sRes.on('data', function (chunk) {
			res.write(chunk);
		});
		sRes.on('end', function() {
			if(sRes.trailers != null) res.addTrailers(sRes.trailers);
			res.end(); inj.code.recEndResponse(id);
			log.add('['+id+'] Server Proxy Response complete.');
		});
	};


	// handle request from user
	inj.code.handleReq = function(req, res) {
		// prepare remote request options
		var id = inj.code.recBeginRequest(req);
		var hReq = req.headers;
		var addr = hReq['user-agent'];
		var host = url.parse(addr).host;
		hReq['user-agent'] = config.usrAgent;
		var options = {
			'method': req.method,
			'host': host,
			'path': addr,
			'headers': hReq
		};
		log.add('['+id+'] Proxy Request to Server: '+addr+'.');
		var sReq = http.request(options, function (sRes) {
			inj.code.handleRes(id, res, sRes);
		});
		sReq.on('error', function(err) {
			log.add('['+id+'] Problem with proxy request: '+err.message+'.');
		});
		req.on('data', function(chunk) {
			sReq.write(chunk);
		});
		req.on('end', function() {
			if(req.trailers !== null) sReq.addTrailers(req.trailers);
			sReq.end(); inj.code.recEndRequest(id);
			log.add('['+id+'] Server Proxy Request complete.');
		});
	};


	return inj;
};
