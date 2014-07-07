/* ---------------
 * Application API
 * ---------------
 * 
 * Provides a API that can be used to access application data.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


module.exports = function(dep, inj) {
	// initialize
	var o = {};
	var log = dep.log;
	var data = dep.data;
	o.buffSize = (dep !== undefined)? dep.buffSize || 8192 : 8192;


	// fetch required data from application datastore
	var getData = function(req) {
		var obj = [];
		for(var i=0; i<req.length; i++) {
			if(req[i] === '*') obj[i] = data;
			else if(req[i].search(/[^A-Za-z\.]/) >= 0) obj[i] = {};
			else {
				try { obj[i] = eval('data.'+req[i]); }
				catch(err) { data[i] = {}; }
			}
		}
		return obj;
	};


	// handle data api request	
	o.onDataReq = function(req, res) {
		var i = req.url.indexOf('?');
		if(i >= 0) {
			var query = req.url.slice(i+1).split('&');
			log.write('URL API query with '+query.length+' requests.');
			res.json(getData(query)); return;
		}
		var buff = '';
		req.on('data', function(chunk) {
			if(buff.length < o.buffSize) buff += chunk;
		});
		req.on('end', function() {
			try {
				var query = JSON.parse(buff);
				log.write('JSON API query with '+query.length+' requests.');
				res.json(getData(query));
			}
			catch(err) {
				res.json(400, {'error': {'message': 'ERRREQUEST'}})
				log.write('Invalid JSON API query.');
			}
		});
	};


	return o;
};
