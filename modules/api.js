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
	var log  = dep.log;
	var data = dep.data;
	try      { o.buffSize = dep.buffSize; }
	catch(e) { o.buffSize = 8192; }



	// fetch from in memory datastore
	var getData = function(qry) {

		// returns json array
		var ret = [];

		// query is an array of string names of variables
		for(var i=0; i<qry.length; i++) {

			// '*' indicates all data in datastore
			if(qry[i] === '*') ret[i] = data;

			// ignore query if contains unwanted chars
			else if(qry[i].search(/[^A-Za-z\.]/) >= 0) ret[i] = {};
			
			// evaluate normal query
			else {
				try { ret[i] = eval('data.'+qry[i]); }
				catch(e) { ret[i] = {}; }
			}
		}
		return ret;
	};



	// handle data api request	
	o.onDataReq = function(req, res) {

		// check if its an url request
		var i = req.url.indexOf('?');
		
		// it is url request
		if(i >= 0) {

			// get all query variable names
			var qry = req.url.slice(i+1).split('&');
			
			// log and retrun json array response
			log.write('URL API query: ['+req.url.slice(i+1)+'].');
			res.json(getData(qry));
			return;
		}

		// it is json request
		var buff = '';

		// store request in buffer
		req.on('data', function(chunk) {
			if(buff.length < o.buffSize) buff += chunk;
		});

		// handle end of request
		req.on('end', function() {
			
			// try sending json response
			try {

				// request is array of string variable names
				var qry = JSON.parse(buff);

				// log and repond with json array
				log.write('JSON API query: ['+buff+'].');
				res.json(getData(qry));
			}

			// in case of error
			catch(e) {

				// send error json response and log
				res.json(400, {'error': {'message': 'ERRREQ'}})
				log.write('Invalid JSON API query.');
			}
		});
	};



	// return
	return o;
};
