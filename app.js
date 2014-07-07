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
	'proxy': {},
	'system': {},
	'process': {}
};


// dependencies
var log = require('./modules/logger')();
var config = require('./modules/config')();
var sysmon = require('./modules/sysmon')(null, data.system);
var procmon = require('./modules/procmon')(null, data.process);
var proxy = require('./modules/proxy')({'log': log}, data.proxy);
var api = require('./modules/api')({'log': log, 'data': data});
var web = require('./modules/router')({'log': log, 'api':api, 'proxy':proxy, 'staticDir': __dirname+'/assets'});


// Create HTTP Server
var server = web.listen(config.port, function() {
	log.write('Proxy started on port '+config.port+'.');
	//  update status every 5s
	setInterval(function() {
		procmon.updateStatus();
		sysmon.updateStatus();
	}, 5*1000);
	// update history every minute
	setInterval(function() {
		procmon.updateHistory();
		sysmon.updateHistory();
		proxy.updateHistory();
	}, 60*1000);
});
