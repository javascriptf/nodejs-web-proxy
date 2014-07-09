/* ----------------
 * Main Application
 * ----------------
 * 
 * This is the main application file.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */



// datastore
var data = {
	'log': 		{},
	'config': 	{},
	'proxy': 	{},
	'system': 	{},
	'process': 	{}
};



// dependencies
var fs		= require('fs');
var log 	= require('./modules/logger')	(null, data.log);
var config 	= require('./modules/config')	(null, data.config);
var sysmon 	= require('./modules/sysmon')	(null, data.system);
var procmon = require('./modules/procmon')	(null, data.process);
var proxy 	= require('./modules/proxy')	({'log': log}, data.proxy);
var api 	= require('./modules/api')		({'log': log, 'data': data});
var web 	= require('./modules/router')	({'log': log, 'api': api, 'proxy': proxy, 'staticDir': __dirname+'/assets'});



// create http server
var server = web.listen(config.port, function() {

	// log application info on startup
	fs.readFile('config/app.txt', function(err, data) {
		console.log(data.toString());
		log.write('Started on port: '+config.port+'.');
	});

	// set socket timeout
	server.setTimeout(config.timeout);

	//  update status around every 5s
	setInterval(function() {
		procmon.updateStatus();
		sysmon.updateStatus();
	}, config.statusUpdateTime);

	// update history around every minute
	setInterval(function() {
		procmon.updateHistory();
		sysmon.updateHistory();
		proxy.updateHistory();
	}, config.historyUpdateTime);
});
