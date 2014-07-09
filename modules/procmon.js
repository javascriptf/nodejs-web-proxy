/* ------------------
 * Process Monitoring
 * ------------------
 * 
 * Monitors current process and provides information about it.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


// dependencies
var tank = require('./tank')();


module.exports = function(dep, inj) {
	// initialize
	var o = {};


	// process status
	o.status = {
		'name':   process.title,
		'time':   process.hrtime()[0],
		'start':  process.hrtime()[0],
		'uptime': process.uptime(),
		'id':   process.pid,
		'env':  process.env,
		'arg':  process.argv,
		'path': process.execPath,
		'argv': process.execArgv,
		'mem': {
			'rss': 0,
			'heap': {
				'used':  0,
				'total': 0
			}
		}
	};


	// process history
	o.history = {
		'time': [],
		'mem': {
			'rss': [],
			'heap': {
				'used':  [],
				'total': []
			}
		}
	};


	// update process status
	o.updateStatus = function() {
		var mem = process.memoryUsage();
		o.status.time   = process.hrtime()[0];
		o.status.uptime = process.uptime();
		o.status.mem.rss        = mem.rss;
		o.status.mem.heap.used  = mem.heapUsed;
		o.status.mem.heap.total = mem.heapTotal;
	};


	// update process history
	o.updateHistory = function() {
		var mem = process.memoryUsage();
		tank.add(o.history.time, process.hrtime()[0]);
		tank.add(o.history.mem.rss,        mem.rss);
		tank.add(o.history.mem.heap.used,  mem.heapUsed);
		tank.add(o.history.mem.heap.total, mem.heapTotal);
	};


	// return
	if(typeof inj !== 'undefined') {
		inj.status  = o.status;
		inj.history = o.history;
	}
	return o;
};
