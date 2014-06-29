// ------------------
// Collection Support
// ------------------

modules.exports = function(inj) {

	// add a new item to a max size collection
	inj.add = function(arr, item, max) {
		if(arr.length > (max || 32)) arr.shift();
		arr[arr.length] = item;
	};

	return inj;
};
