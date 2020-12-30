// Object Builder
// --------------
// 
// Provides convenient functions for building objects.


module.exports = function(dep, inj) {
	// initialize
	var o = {};



	// get a deep copied, merged JSON object
	o.copy = function(arr) {
        
		// init merge string
		var mrg = '';

		// loop through array of json objects
		for(var i=0; i<arr.length; i++) {

			// stringify and concat with ','
			var str = JSON.stringify(arr[i]);
			mrg += ((i > 0)? ',':'') + str.slice(1, str.length-1);
		}

		// return parsed and merged object
		return JSON.parse('{'+mrg+'}');
	}



	// return
	return o;
};
