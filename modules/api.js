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
	try { o.buffSize = dep.buffSize; }
	catch(e) { o.buffSize = 8192; }


	// fetch from in memory datastore
	var getData = function(qry) {
		var ret = [];
		for(var i=0; i<qry.length; i++) {
			if(qry[i] === '*') ret[i] = data;
			else if(qry[i].search(/[^A-Za-z\.]/) >= 0) ret[i] = {};
			else {
				try { ret[i] = eval('data.'+qry[i]); }
				catch(e) { ret[i] = {}; }
			}
		}
		return ret;
	};


	// handle data api request	
	o.onDataReq = function(req, res) {
		var i = req.url.indexOf('?');
		if(i >= 0) {
			var qry = req.url.slice(i+1).split('&');
			log.write('URL API query with '+qry.length+' requests.');
			res.json(getData(qry)); return;
		}
		var buff = '';
		req.on('error', function(err) {
			res.json(400, {'error': {'message': 'ERRREQ'}});
			log.write('Invalid URL API query.');
		})
		req.on('data', function(chunk) {
			if(buff.length < o.buffSize) buff += chunk;
		});
		req.on('end', function() {
			try {
				var qry = JSON.parse(buff);
				log.write('JSON API query with '+qry.length+' requests.');
				res.json(getData(qry));
			}
			catch(e) {
				res.json(400, {'error': {'message': 'ERRREQ'}})
				log.write('Invalid JSON API query.');
			}
		});
	};


	return o;
};
