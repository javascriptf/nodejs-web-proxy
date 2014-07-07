/* --------------
 * Object Builder
 * --------------
 * 
 * Provides convenient functions for building objects.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


module.exports = function(dep, inj) {
	// initialize
	var o = {};


	// get a deep copied, merged JSON object
	o.copy = function(arr) {
		var mrg = '';
		for(var i=0; i<arr.length; i++) {
			var str = JSON.stringify(arr[i]);
			mrg += ((i > 0)? ',' : '') + str.slice(1, str.length-1);
		}
		return JSON.parse('{'+mrg+'}');
	}


	// return
	return o;
};