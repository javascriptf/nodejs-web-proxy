/*---------------*
 * AppLog Module
 *---------------*/


// required modules
var module = require('module');


// appLog class
module.exports = function(maxSz) {
	return {
		

		// log data
		data: [],


		// clear logs
		clear: function() {
			data = [];
		},


		// write to log
		write: function(msg) {
			data[data.length] = msg;
			console.log(msg);
		},


		// read from logs & clear
		read: function(msg) {
			var dat = data;
			data = [];
			return dat;
		}
	};
};
