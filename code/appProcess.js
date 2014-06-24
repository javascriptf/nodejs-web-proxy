/*-------------------*
 * AppProcess Module
 *-------------------*/


// store process start time
exports.startTime = 0;


// store appLog object
exports.log = {};


// get process informtion
exports.info = function() {
	return {
		'argv': process.argv,
		'execPath': process.execPath,
		'execArgv': process.execArgv,
		'env': process.env,
		'pid': process.pid,
		'title': process.title,
		'arch': process.arch,
		'platform': process.platform,
	};
};


// get memory usage
exports.memoryUsage = function() {
	return process.memoryUsage();
};


// get runtime details
exports.runTime = function() {
	return {
		'startTime': startTime,
		'uptime': process.uptime(),
		'time': process.hrtime()[0]
	};
};


// log on process exit
process.on('exit', function(code) {
	log.write('Exiting process at ' + process.hrtime[0] + ' seconds');
});
