/*--------------*
 * AppOs Module
 *--------------*/


// required modules
var os = require('os');


// store appLog object
exports.log = {};


// get os informtion
exports.info = function() {
	return {
		'tmpdir': os.tmpdir(),
		'endian': os.endianness(),
		'hostName': os.hostname(),
		'name': os.type(),
		'platform': os.platform(),
		'arch': os.arch(),
		'release': os.release(),
		'cpu': os.cpus(),
		'network': os.networkInterfaces()
	};
};


// get memory usage
exports.memoryUsage = function() {
	return {
		'total': os.totalmem(),
		'free': os.freemem()
	};
};


// get runtime details
exports.runTime = function() {
	return {
		'uptime': os.uptime(),
		'loadAvg': os.loadavg()
	};
};
