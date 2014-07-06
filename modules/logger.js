/* ------
 * Logger
 * ------
 * 
 * Provides a log module that can be used to log information. Multiple
 * types of logs can be used but all logs are output into the console.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


module.exports = function(dep, inj) {
	// initialize
	var o = {};
	o.data = [];
	o.maxLen = dep.maxLen || 32;


	// clear logs
	o.clear = function() {
		o.data = [];
	};


	// add new log and send to console
	o.write = function(msg) {
		if(o.data.length > o.maxLen) o.data.shift();
		o.data[o.data.length] = msg;
		console.log(msg);
	}


	// return
	inj.data = o.data;
	inj.maxLen = o.maxLen;
	return o;
};
