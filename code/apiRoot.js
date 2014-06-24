/*----------------*
 * ApiRoot Module
 *----------------*/


// required modules
var fs = require('fs');


// store appLog object
exports.log = {};


// get root web page
exports.page = function(req, res) {
	log.write('Main Page accessed ' + req.url);
	fs.readFile('assets/html/index.html', function(err, data) {
		res.writeHead(200, {'content-type': 'text/html'});
		res.end(data);
	});
};
