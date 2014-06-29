// ----------------
// Required Modules
// ----------------
var fs = require('fs');
var os = require('os');
var url = require('url');
var express = require('express');

var appLog = require('./modules/app-log.js');
var appColl = require('./modules/app-coll.js');
var appSend = require('./modules/app-config.js');
var appConfig = require('./modules/app-config.js');

var web = express();

var app = {};
app = appLog(app);
app = appColl(app);
app = appSend(app);
app = appConfig(app);



// --------
// App Info
// --------

// initialize system info
app.system = {
	'name': os.hostname(),
	'tmpdir': os.tmpdir(),
	'time': process.hrtime()[0],
	'uptime': os.uptime(),
	'mem': {
		'total': os.totalmem(),
		'free': os.freemem(),
	},
	'load': os.loadavg()[0],
	'os': {
		'type': os.type(),
		'release': os.release(),
		'platform': os.platform()
	},
	'cpu': {
		'type': os.cpus(),
		'arch': os.arch(),
		'endian': os.endianness()
	},
	'network': os.networkInterfaces()
};

// initialize process info
app.process = {
	'pid': process.pid,
	'env': process.env,
	'argv': process.argv,
	'title': process.title,
	'uptime': process.uptime(),
	'execPath': process.execPath,
	'execArgv': process.execArgv,
	'startTime': process.hrtime()[0],
	'mem': {
		'heapTotal': 0,
		'heapUsed': 0,
		'rss': 0
	}
};

// initialize proxy info
app.proxy = {
	'request': {
		'pending': 0,
		'lastMin': 0,
		'total': 0,
		'rate': 0
	},
	'response': {
		'lastMin': 0,
		'total': 0,
		'rate': 0
	}
};

// initialize runtime info
app.runtime = {
	'system': {
		'time': [],
		'mem': {
			'free': []
		},
		'load': []
	},
	'process': {
		'mem': {
			'heapTotal': [],
			'heapUsed': [],
			'rss': []
		}
	},
	'proxy': {
		'rate': {
			'request': [],
			'response': []
		},
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
	}
};

// update info
app.updateSystem = function() {
	var sys = app.system;
	sys.time = process.hrtime()[0];
	sys.uptime = os.uptime();
	sys.mem.free = os.freemem();
	sys.load = os.loadavg()[0];
};

// update info
app.updateProcess = function() {
	var pro = app.process;
	var mem = process.memoryUsage();
	pro.uptime = process.uptime();
	pro.mem.heapTotal = mem.heapTotal;
	pro.mem.heapUsed = mem.heapUsed;
	pro.mem.rss = mem.rss;
};

// update runtime system info
app.updateRuntimeSystem = function() {
	var sys = app.runtime.system;
	coll.add(sys.time, process.hrtime()[0]);
	coll.add(sys.mem.free, os.freemem());
	coll.add(sys.load, os.loadavg()[0]);
}

// update runtime process info
app.updateRuntimeProcess = function() {
	var pro = app.runtime.process;
	var mem = process.memoryUsage();
	coll.add(pro.mem.heapTotal, mem.heapTotal);
	coll.add(pro.mem.heapUsed, mem.heapUsed);
	coll.add(pro.mem.rss, mem.rss);
};

// add proxy request info
app.addProxyRequest = function(req) {
	++app.proxy.request.pending;
	var id = ++app.proxy.request.total;
	var reqUrl = req.headers['user-agent'];
	var pxya = app.runtime.proxy.active;
	if(pxya.id.length >= 32 && (pxya.response[0] === undefined || pxya.response[0].complete === false)) {
		var pxyf = app.runtime.proxy.failed;
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
app.completeProxyRequest = function(id) {
	var pxy = app.runtime.proxy.active;
	var i = pxy.id.indexOf(id);
	if(i >= 0) pxy.request[i].complete = true;
};

// add proxy response info
app.addProxyResponse = function(id, res) {
	--app.proxy.request.pending;
	++app.proxy.response.total;
	var pxy = app.runtime.proxy.active;
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
app.completeProxyResponse = function(id) {
	var pxy = app.runtime.proxy.active;
	var i = pxy.id.indexOf(id);
	if(i >= 0) pxy.response[i].complete = true;
};

// update proxy info
app.updateProxy = function() {
	var apr = app.proxy.request;
	apr.rate = apr.total - apr.lastMin;
	apr.lastMin = apr.total;
	var aps = app.proxy.response;
	aps.rate = aps.total - aps.lastMin;
	aps.lastMin = aps.total;
};

// update runtime proxy info
app.updateRuntimeProxy = function() {
	coll.add(app.runtime.proxy.rate.request, app.proxy.request.rate);
	coll.add(app.runtime.proxy.rate.response, app.proxy.response.rate);
};

// update runtime info
app.updateRuntime = function() {
	app.updateRuntimeSystem();
	app.updateRuntimeProcess();
	app.updateRuntimeProxy();
};



// ---------
// Proxy API
// ---------

// process server response
app.onServerResp = function(id, res, sRes) {
	// tweak content-length
	var sHdr = sRes.headers;
	sHdr['server'] = sHdr['content-length'];
	sHdr['transfer-encoding'] = 'chunked';
	sHdr['content-length'] 	= 0;
	app.addProxyResponse(id, res);
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
		app.completeProxyResponse(id);
	});
}


// process proxy request
web.all('/proxy', function(req, res) {
	// prepare remote request options
	log.add('Proxy accessed.');
	var hReq = req.headers;
	var reqUrl = hReq['user-agent'];
	var hostName = url.parse(reqUrl).host;
	hReq['host'] = hostName;
	hReq['user-agent'] = app.config.usrAgent;
	var options = {
		'method': req.method,
		'host': hostName,
		'path': reqUrl,
		'headers': hReq
	};
	var id = app.addProxyRequest(req);
	log.add('['+id+'] Request to Server: ' + reqUrl);
	var sReq = http.request(options, function (sRes) {
		app.onSrvrResponse(id, res, sRes);
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
	app.completeProxyRequest(id);
	log.add('['+id+'] Server Request complete');
});



// -------
// Web API
// -------

// get app config
web.get('/api/config', function(req, res) {
	log.add('Config API accessed.');
	app.sendJson(res, app.config);
});

// read current log
web.get('/api/log', function(req, res) {
	log.add('Log API accessed.');
	app.sendJson(res, log.data);
});

// get system info
web.get('/api/system', function(req, res) {
	app.updateSystem();
	log.add('System API accessed.');
	app.sendJson(res, app.system);
});

// get process info
web.get('/api/process', function(req, res) {
	app.updateProcess();
	log.add('Process API accessed.');
	app.sendJson(res, app.process);
});

// get proxy info
web.get('/api/proxy', function(req, res) {
	log.add('Proxy API accessed.');
	app.sendJson(res, app.proxy);
});

// get runtime info
web.get('/api/runtime', function(req, res) {
	log.add('Runtime API accessed.');
	app.sendJson(res, app.runtime);
});

// get runtime[system] info
web.get('/api/runtime/system', function(req, res) {
	log.add('Runtime[system] API accessed.');
	app.sendJson(res, app.runtime.system);
});

// get runtime[process] info
web.get('/api/runtime/process', function(req, res) {
	log.add('Runtime[process] API accessed.');
	app.sendJson(res, app.runtime.process);
});

// get runtime[proxy] info
web.get('/api/runtime/proxy', function(req, res) {
	log.add('Runtime[proxy] API accessed.');
	app.sendJson(res, app.runtime.proxy)
});

// get runtime[proxy][rate] info
web.get('/api/runtime/proxy/rate', function(req, res) {
	log.add('Runtime[proxy][rate] API accessed.');
	app.sendJson(res, app.runtime.proxy.rate);
});

// get runtime[proxy][active] info
web.get('/api/runtime/proxy/active', function(req, res) {
	log.add('Runtime[proxy][active] API accessed.');
	app.sendJson(res, app.runtime.proxy.active);
});

// get runtime[proxy][failed] info
web.get('/api/runtime/proxy/failed', function(req, res) {
	log.add('Runtime[proxy][failed] API accessed.');
	app.sendJson(res, app.runtime.proxy.failed);
});

// get headers
web.get('/api/headers', function(req, res) {
	log.add('Headers API accessed.');
	app.sendJson(res, req.headers);
});



// ---------------
// Web Page Access
// ---------------

// root web page
web.get('/', function(req, res) {
	log.add('Root Web Page accessed.');
	app.sendHtml(res, 'assets/html/index.html');
});

// status web page
web.get('/status', function(req, res) {
	log.add('Status Web page accessed');
	app.sendHtml(res, 'assets/html/status.html');
})

// static files
web.use(express.static(__dirname + '/assets'));

// wrong path
web.use(function(req, res, next) {
	log.add('Wrong Path['+req.url+'] accessed.');
	app.sendHtml(res, 'assets/html/404.html');
});



// ------------------
// Create HTTP Server
// ------------------
var server = web.listen(app.config.port, function() {
	log.add('Proxy started on port '+app.config.port+'.');
	setInterval(function() {
		app.updateRuntime();
		app.updateProxy();
	}, 5*60*1000);
});
