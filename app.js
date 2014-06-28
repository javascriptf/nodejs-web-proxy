// ----------------
// Required Modules
// ----------------
var fs = require('fs');
var os = require('os');
var url = require('url');
var express = require('express');

var web = express();
var app = {};



// -------------
// Configuration
// -------------
app.config = {
	'usrAgent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/21.0',
	'port': process.env.PORT || 80
};



// -----------
// App Support
// -----------
// send json data
app.sendJson = function(res, data) {
	res.writeHead(200, {'content-type': 'application/json'});
	res.end(JSON.stringify(data));
};

// send html file
app.sendHtml = function(res, file) {
	fs.readFile(file, function(err, data) {
		res.writeHead(200, {'content-type': 'text/html'});
		res.end(data);
	});
};



// ------------------
// Collection Support
// ------------------
var coll = {
	// add a new item to a max size collection
	add: function(arr, item, max) {
		if(arr.length > (max || 32)) arr.shift();
		arr[arr.length] = item;
	}
};



// -----------
// Log Support
// -----------
var log = {
	data: [],
	maxLen: 32,

	// clear logs
	clear: function() {
		this.data = [];
	},

	// add new log and send to console
	add: function(msg) {
		if(this.data.length > this.maxLen) this.data.shift();
		this.data[this.data.length] = msg;
		console.log(msg);
	}
};



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

// update runtime info
app.updateRuntime = function() {
	app.updateRuntimeSystem();
	app.updateRuntimeProcess();
};



// ---------
// Proxy API
// ---------

// process server response
function onServerResp(id, res, sRes) {
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
web.all('/run/proxy', function(req, res) {
	// prepare remote request options
	log.add('Run[proxy] API accessed.');
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
		onSrvrResponse(id, res, sRes);
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
web.get('/config', function(req, res) {
	log.add('Config API accessed.');
	app.sendJson(res, app.config);
});

// read current log
web.get('/log', function(req, res) {
	log.add('Log API accessed.');
	app.sendJson(res, log.data);
});

// get system info
web.get('/system', function(req, res) {
	app.updateSystem();
	log.add('System API accessed.');
	app.sendJson(res, app.system);
});

// get process info
web.get('/process', function(req, res) {
	app.updateProcess();
	log.add('Process API accessed.');
	app.sendJson(res, app.process);
});

// get proxy info
web.get('/proxy', function(req, res) {
	log.add('Proxy API accessed.');
	app.sendJson(res, app.proxy);
});

// get runtime info
web.get('/runtime', function(req, res) {
	log.add('Runtime API accessed.');
	app.sendJson(res, app.runtime);
});

// get runtime[system] info
web.get('/runtime/system', function(req, res) {
	log.add('Runtime[system] API accessed.');
	app.sendJson(res, app.runtime.system);
});

// get runtime[process] info
web.get('/runtime/process', function(req, res) {
	log.add('Runtime[process] API accessed.');
	app.sendJson(res, app.runtime.process);
});

// get runtime[proxy] info
web.get('/runtime/proxy', function(req, res) {
	log.add('Runtime[proxy] API accessed.');
	app.sendJson(res, app.runtime.proxy)
});

// get runtime[proxy][active] info
web.get('/runtime/proxy/active', function(req, res) {
	log.add('Runtime[proxy][active] API accessed.');
	app.sendJson(res, app.runtime.proxy.active);
});

// get runtime[proxy][failed] info
web.get('/runtime/proxy/failed', function(req, res) {
	log.add('Runtime[proxy][failed] API accessed.');
	app.sendJson(res, app.runtime.proxy.failed);
});

// get headers
web.get('/headers', function(req, res) {
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
web.get('/web/status', function(req, res) {
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
	log.add('Proxy started on port ' + app.config.port);
	setInterval(function() {
		app.updateRuntime();
		app.updateProxy();
	}, 60000);
});
