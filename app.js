// required headers
var http = require("http");
var url = require("url");
var fs = require('fs');


// settings
var port = process.env.PORT;
var defUserAgent = "Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/21.0";


// ui data
var uiLog = [];


// write log
function writeLog(log)
{
	console.log(log);
	// uiLog[uiLog.length] = log;
}


// main web page
function defaultPage(req, resp)
{
	writeLog("Main Page accessed");
	resp.writeHead(200, {"content-type": "text/plain"});

	fs.readFile('index.html', function(err, data) {
		if(!err) resp.end('system error');
		else resp.end(data);
	});
}


// process server response
function onServerResp(resp, sResp)
{
	// begin reponse to proxy helper
	writeLog("Server Response started");
	// tweak content-length
	var sHdr = sResp.headers;
	sHdr["server"] = sHdr["content-length"];
	sHdr["transfer-encoding"] = "chunked";
	sHdr["content-length"] = 0;
	resp.writeHead(sResp.statusCode, sHdr);
	sResp.on('data', function (chunk) {
		// add response data
		resp.write(chunk);
	});
	sResp.on('end', function() {
		// complete response to proxy helper
		console.log("Server Response complete");
		if(sResp.trailers != null)
			resp.addTrailers(sResp.trailers);
		resp.end();
	});
}


// process user request
function onUserRequest(req, resp)
{
	writeLog("Request: " + req.url);

	// goto main page on root url
	if(req.url.indexOf("/proxy") < 0) {
		defaultPage(req, resp);
		return;
	}

	// retrieve request url
	var reqUrl = req.headers["user-agent"];
	var hostName = url.parse(urlName).host;

	// prepare options for the server
	var hReq = req.headers;
	hReq["host"] = hostName;
	hReq["user-agent"] = defUserAgent;
	var options = {
		"method": req.method,
		"host": hostName,
		"path": reqUrl,
		"headers": hReq
	};

	writeLog("Request to Server: " + reqUrl);
	var sReq = http.request(options, function (sResp) {
		onSrvrResponse(resp, sResp);
	});

	sReq.on('error', function(err) {
		writeLog('Problem with request: ' + err.message);
	});

	var reqData = req.read();
	if(reqData != null)
		sReq.write(reqData);
	
	if(req.trailers != null)
		sReq.addTrailers(req.trailers);
	
	sReq.end();
	writeLog("Server Request complete");
}


// create http server on preferred port
http.createServer(onUserRequest).listen(port);
writeLog("Proxy started on port " + port);
