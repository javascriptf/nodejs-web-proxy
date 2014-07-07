/* -------------------------
 * Application Configuration
 * -------------------------
 * 
 * Provides most configuration information used by the application to operate.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


module.exports = function(dep, inj) {
	// initialize
	var o = {};


	// when proxy requests the remote server, this is the user-agent
	o.usrAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/21.0';
	

	// port number the HTTP server runs on
	o.port = process.env.PORT || 80;
	
	
	// return
	return o;
}
