/* -------------------
 * HTTP Input / Output
 * -------------------
 * 
 * Provides basic methods to send / receive data via HTTP.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


// dependencies
var fs = require('fs');
var events = require('events');


module.exports = function(dep, inj) {
	// initialize
	var o = {};
	o.buffSize = dep.buffSize || 8192;

	
	// send json data
	o.writeJson = function(res, data) {
		res.writeHead(200, {'content-type': 'application/json'});
		res.end(JSON.stringify(data));
	};


	// send html file
	o.writeHtml = function(res, file) {
		fs.readFile(file, function(err, data) {
			res.writeHead(200, {'content-type': 'text/html'});
			res.end(data);
		});
	};


	// receive json data
	o.readJson = function(req) {
		var buffer = '';
		var tooBig = false;
		var evnt = new events.EventEmitter();
		req.on('data', function(chunk) {
			if(buffer.length < o.buffSize) {
				buffer += chunk;
				evnt.emit('data');
			}
			else tooBig = true;
		});
		req.on('end', function() {
			if(tooBig) evnt.emit('error');
			evnt.emit('end');
		})
		return evnt;
	};


	// return
	return o;
};
