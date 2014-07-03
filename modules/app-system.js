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
 * -----------------
 * System Monitoring
 * -----------------
 * 
 * File: app-system.js
 * Project: Web Proxy
 * 
 * Monitors current system and provides information about it.
 * 
 */


// required modules
var os = require('os');
var mTank = require('./app-tank.js');

// initialize modules
var tank = mTank({});


module.exports = function(inj) {


	// system status
	var status = {
		'name': os.hostname(),
		'tmpdir': os.tmpdir(),
		'time': process.hrtime()[0],
		'uptime': os.uptime(),
		'mem': {
			'free': os.freemem(),
			'total': os.totalmem()
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


	// system history
	var history = {
		'time': [],
		'mem': { 'free': [] },
		'load': []
	};


	// inject data
	inj.data.status = status;
	inj.data.history = history;


	// update status
	inj.code.updateStatus = function() {
		status.time = process.hrtime()[0];
		status.uptime = os.uptime();
		status.mem.free = os.freemem();
		status.load = os.loadavg()[0];
	};


	// update history
	inj.code.updateHistory = function() {
		tank.add(history.time, process.hrtime()[0]);
		tank.add(history.mem.free, os.freemem());
		tank.add(history.load, os.loadavg()[0]);
	};


	return inj;
};
