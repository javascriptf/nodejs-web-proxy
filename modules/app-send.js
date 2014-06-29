// ------------
// Send Support
// ------------

module.exports = function(inj) {

	// send json data
	inj.sendJson = function(res, data) {
		res.writeHead(200, {'content-type': 'application/json'});
		res.end(JSON.stringify(data));
	};

	// send html file
	inj.sendHtml = function(res, file) {
		fs.readFile(file, function(err, data) {
			res.writeHead(200, {'content-type': 'text/html'});
			res.end(data);
		});
	};

	return inj;
};
