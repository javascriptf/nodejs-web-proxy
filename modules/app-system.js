// -------------
// System Status
// -------------

// required modules
var os = require('os');
var appColl = require('./app-coll.js');

var coll = appColl({});


module.exports = function(inj) {

	// initialize system info
	inj.status = {
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

	// initialize runtime system info
	inj.runtime = {
		'time': [],
		'mem': { 'free': [] },
		'load': []
	};

	// update info
	inj.func.update = function() {
		var sys = inj.status;
		sys.time = process.hrtime()[0];
		sys.uptime = os.uptime();
		sys.mem.free = os.freemem();
		sys.load = os.loadavg()[0];
	};


	// update runtime system info
	inj.func.updateRuntime = function() {
		var sys = inj.runtime;
		coll.add(sys.time, process.hrtime()[0]);
		coll.add(sys.mem.free, os.freemem());
		coll.add(sys.load, os.loadavg()[0]);
	};

	return inj;
};
