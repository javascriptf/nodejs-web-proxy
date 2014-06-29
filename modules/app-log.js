// -----------
// Log Support
// -----------

module.exports = function(inj) {

	inj = {
		data: [],
		maxLen: 32,

		// clear logs
		clear: function() {
			this.data = [];
		},

		// add new log and send to console
		add: function(msg) {
			if(this.data.length > this.maxLen) this.data.shift();
			this.data[this.data.length] = msg;
			console.log(msg);
		}
	};

};
