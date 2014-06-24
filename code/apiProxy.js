/*-----------------*
 * ApiProxy Module
 *-----------------*/


// required modules
var fs = require('fs');


// store appLog object
exports.log = {};


// process server response
function onServerResp(res, sRes) {
	log.write('Server Response started');
	// tweak content-length
	var sHdr = sRes.headers;
	sHdr['server'] = sHdr['content-length'];
	sHdr['transfer-encoding'] = 'chunked';
	sHdr['content-length'] 	= 0;
	res.writeHead(sRes.statusCode, sHdr);
	sRes.on('data', function (chunk) {
		res.write(chunk);
	});
	sRes.on('end', function() {
		log.write('Server Response complete');
		if(sRes.trailers != null)
			res.addTrailers(sRes.trailers);
		res.end();
	});
}


// process proxy request
exports.page = function(req, res) {
	// retrieve request url
	var reqUrl = req.headers['user-agent'];
	var hostName = url.parse(urlName).host;
	// prepare options for the server
	var hReq = req.headers;
	hReq['host'] = hostName;
	hReq['user-agent'] = usrAgent;
	var options = {
		'method': req.method,
		'host': hostName,
		'path': reqUrl,
		'headers': hReq
	};
	log.write('Request to Server: ' + reqUrl);
	var sReq = http.request(options, function (sRes) {
		onSrvrResponse(res, sRes);
	});
	sReq.on('error', function(err) {
		log.write('Problem with request: ' + err.message);
	});
	var reqData = req.read();
	if(reqData != null)
		sReq.write(reqData);
	if(req.trailers != null)
		sReq.addTrailers(req.trailers);
	sReq.end();
	log.write('Server Request complete');
};