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
 * ---------------
 * Application API
 * ---------------
 * 
 * File: app-api.js
 * Project: Web Proxy
 * 
 * Provides a API that can be used to access application data.
 * 
 */


module.exports = function(inj) {


	// get dependencies
	var app = inj.sender;
	var log = inj.log;

	// max allowed request data
	var maxData = 8192;


	// get required data
	var getData = function(req) {
		var data = [];
		for(var i=0; i<req.length; i++) {
			if(req[i] === '*') data[i] = inj.data;
			else if(req[i].search(/[^A-Za-z\.]/) >= 0) {
				data[i] = {};
			}
			else {
				try { data[i] = eval('inj.data.'+req[i]); }
				catch(err) { data[i] = {}; }
			}
		}
		return data;
	};


	// handle data api request	
	inj.code.onDataReq = function(req, res) {
		var i = req.url.indexOf('?');
		if(i >= 0) {
			var query = req.url.slice(i+1);
			query = query.split('&');
			log.add('URL API query with '+query.length+' requests.');
			app.sendJson(res, getData(query));
			return;
		}
		var data = '';
		req.on('data', function(chunk) {
			if(data.length < maxData)
			data += chunk;
		});
		req.on('end', function() {
			try {
				var query = JSON.parse(data);
				log.add('JSON API query with '+query.length+' requests.');
				app.sendJson(res, getData(query));
			}
			catch(err) {
				res.statusCode = 400;
				res.end('Error with request data.');
				log.add('Invalid JSON API query.');
			}
		});
	};


	return inj;
};
