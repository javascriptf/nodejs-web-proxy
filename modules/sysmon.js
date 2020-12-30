// System Monitoring
// -----------------
// 
// Monitors current system and provides information about it.


// dependencies
var os   = require('os');
var tank = require('./tank')();


module.exports = function(dep, inj) {
	// initialize
	var o = {};


	// system status
	o.status = {
		'name':   os.hostname(),
		'tmpdir': os.tmpdir(),
		'time':   process.hrtime()[0],
		'uptime': os.uptime(),
		'mem': {
			'free':  os.freemem(),
			'total': os.totalmem()
		},
		'load': os.loadavg()[0],
		'os': {
			'type':     os.type(),
			'release':  os.release(),
			'platform': os.platform()
		},
		'cpu': {
			'type':   os.cpus(),
			'arch':   os.arch(),
			'endian': os.endianness()
		},
		'network': os.networkInterfaces()
	};


	// system history
	o.history = {
		'time': [],
		'mem':  { 'free': [] },
		'load': []
	};


	// update system status
	o.updateStatus = function() {
		o.status.time     = process.hrtime()[0];
		o.status.uptime   = os.uptime();
		o.status.mem.free = os.freemem();
		o.status.load     = os.loadavg()[0];
	};


	// update system history
	o.updateHistory = function() {
		tank.add(o.history.time,     process.hrtime()[0]);
		tank.add(o.history.mem.free, os.freemem());
		tank.add(o.history.load,     os.loadavg()[0]);
	};


	// return
	if(typeof inj !== 'undefined') {
		inj.status  = o.status;
		inj.history = o.history;
	}
	return o;
};
