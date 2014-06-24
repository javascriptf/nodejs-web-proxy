/*---------------*
 * ApiLog Module
 *---------------*/


// store appLog object
exports.log = {};


// get os informtion
exports.read = function(req, res) {
	res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(log.read()));
};
