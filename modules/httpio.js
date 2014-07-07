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
	o.buffSize = (dep !== undefined)? dep.buffSize || 8192 : 8192;

	
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


	// receive data
	o.readData = function(req) {
		var err = null;
		var data = '';
		var evnt = new events.EventEmitter();
		req.on('data', function(chunk) {
			if(data.length < o.buffSize) data += chunk;
			else err = (err !== null)? new Error('TOOBIG') : err;
		});
		req.on('error', function(e) {
			evnt.emit('error', e);
		});
		req.on('end', function() {
			if(err !== null) evnt.emit('error', err);
			evnt.emit('end', buffer);
		});
		return evnt;
	};


	// return
	return o;
};
