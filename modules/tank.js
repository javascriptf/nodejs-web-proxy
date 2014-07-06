/* ----------------
 * Tank: Collection
 * ----------------
 * 
 * Tank is a data structure where data flows in from one end, and flows out
 * from another end. However, due to its limited size excess inflow of data
 * would cause data near the other end to flow out.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */


module.exports = function(dep, inj) {
	// initialize
	var o = {};


	// add an item (to the inflow end)
	o.add = function(arr, item, max) {
		if(arr.length > (max || 32)) arr.shift();
		arr[arr.length] = item;
	};


	// remove an item (from the outflow end)
	o.remove = function(arr) {
		if(arr.length > 0) arr.shift();
	}

	// return
	return o;
};
