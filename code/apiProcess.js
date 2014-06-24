/*-------------------*
 * ApiProcess Module
 *-------------------*/


// required modules
var apiProcess = require('apiProcess.js');


// store appLog object
exports.log = {};


// get process informtion
exports.info = function(req, res) {
	res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(apiProcess.info()));
};


// get memory usage
exports.memoryUsage = function(req, res) {
	res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(apiProcess.memoryUsage()));
};


// get runtime details
exports.runTime = function() {
	res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(apiProcess.runTime()));
};
