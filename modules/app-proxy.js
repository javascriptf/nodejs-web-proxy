// -------------
// Proxy Support
// -------------

// required modules
var url = require('url');

var appLog = require('./app-log.js');
var appColl = require('./app-coll.js');
var appConfig = require('./app-config.js');

var log = appLog({});
var coll = appColl({});
var config = appConfig({});


module.exports = function(inj) {

	// initialize proxy info
	inj.status = {
		'request': {
			'total': 0,
			'failed': 0,
			'pending': 0
		},
		'response': {
			'total': 0
		}
	};

	// initialize runtime proxy info
	inj.runtime = {
		'request': {
			'total': [],
			'failed': [],
			'pending': []
		},
		'response': {
			'total': []
		}
	};

	// initialize proxy log
	inj.log = {
		'active': {
			'id': [],
			'request': [],
			'response': []
		},
		'failed': {
			'id': [],
			'request': [],
			'response': []
		}
	};


	// add proxy request info
	inj.func.logBeginRequest = function(req) {
		++inj.status.request.pending;
		var id = ++inj.status.request.total;
		var reqUrl = req.headers['user-agent'];
		var pxya = inj.log.active;
		if(pxya.id.length >= 32 && (pxya.response[0] === undefined || pxya.response[0].complete === false)) {
			var pxyf = inj.log.failed;
			coll.add(pxyf.id, pxya.id[0]);
			coll.add(pxyf.request, pxya.request[0]);
			coll.add(pxyf.response, pxya.response[0])
		}
		coll.add(pxya.id, id);
		coll.add(pxya.request, {
			'time': process.hrtime()[0],
			'path': reqUrl,
			'host': url.parse(reqUrl).host,
			'method': req.method,
			'headers': req.headers,
			'version': req.httpVersion,
			'trailers': req.trailers,
			'complete': false
		});
		return id;
	};

	// complete proxy request
	inj.func.logEndRequest = function(id) {
		var pxy = inj.log.active;
		var i = pxy.id.indexOf(id);
		if(i >= 0) pxy.request[i].complete = true;
	};

	// add proxy response info
	inj.func.logBeginResponse = function(id, res) {
		--inj.status.request.pending;
		++inj.status.response.total;
		var pxy = inj.log.active;
		var i = pxy.id.indexOf(id);
		if(i >= 0) pxy.response[i] = {
			'time': process.hrtime()[0],
			'status': res.statusCode,
			'headers': res.headers,
			'version': res.httpVersion,
			'trailers': res.trailers,
			'complete': false
		};
	};

	// complete proxy response
	inj.func.logEndResponse = function(id) {
		var pxy = inj.log.active;
		var i = pxy.id.indexOf(id);
		if(i >= 0) pxy.response[i].complete = true;
	};

	// update runtime proxy info
	inj.func.updateRuntime = function() {
		coll.add(inj.runtime.request.total, inj.status.request.total);
		coll.add(inj.runtime.request.failed, inj.status.request.failed);
		coll.add(inj.runtime.request.pending, inj.status.request.pending);
		coll.add(inj.runtime.response.total, inj.status.response.total);
	};

	// process server response
	inj.func.onServerRes = function(id, res, sRes) {
		// tweak content-length
		var sHdr = sRes.headers;
		sHdr['server'] = sHdr['content-length'];
		sHdr['transfer-encoding'] = 'chunked';
		sHdr['content-length'] 	= 0;
		inj.func.logBeginResponse(id, res);
		log.add('['+id+'] Server Response started.');
		res.writeHead(sRes.statusCode, sHdr);
		sRes.on('data', function (chunk) {
			res.write(chunk);
		});
		sRes.on('end', function() {
			if(sRes.trailers != null)
				res.addTrailers(sRes.trailers);
			res.end();
			log.add('['+id+'] Server Response complete.');
			inj.func.logEndResponse(id);
		});
	}


	// process proxy request
	in.func.onProxyReq = function(req, res) {
		// prepare remote request options
		log.add('Proxy accessed.');
		var hReq = req.headers;
		var reqUrl = hReq['user-agent'];
		var hostName = url.parse(reqUrl).host;
		hReq['host'] = hostName;
		hReq['user-agent'] = config.usrAgent;
		var options = {
			'method': req.method,
			'host': hostName,
			'path': reqUrl,
			'headers': hReq
		};
		var id = inj.func.logBeginRequest(req);
		log.add('['+id+'] Request to Server: ' + reqUrl);
		var sReq = http.request(options, function (sRes) {
			inj.func.onServerRes(id, res, sRes);
		});
		sReq.on('error', function(err) {
			log.add('['+id+'] Problem with request: ' + err.message);
		});
		var reqData = req.read();
		if(reqData != null)
			sReq.write(reqData);
		if(req.trailers != null)
			sReq.addTrailers(req.trailers);
		sReq.end();
		inj.func.logEndRequest(id);
		log.add('['+id+'] Server Request complete');
	});

	return inj;
};
