/*--------------*
 * ApiOs Module
 *--------------*/


// required modules
var apiOs = require('apiOs.js');


// store appLog object
exports.log = {};


// get os informtion
exports.info = function(req, res) {
	res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(apiOs.info()));
};


// get memory usage
exports.memoryUsage = function(req, res) {
	res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(apiOs.memoryUsage()));
};


// get runtime details
exports.runTime = function(req, res) {
	res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(apiOs.memoryUsage()));
};
