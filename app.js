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
	uiLog[uiLog.length] = log;
}


// main web page
function defaultPage(resp)
{
	writeLog("Main Page accessed");
	resp.writeHead(200, {"content-type": "text/plain"});
	resp.write("wb_Proxy: Hello!");
	resp.end();
}


// process server response
function onServerResp(resp, srvrResp)
{
	// Begin reponse to proxy helper
	writeLog("Server Response started");
	// Tweak content-length
	var srvrHeaders = srvrResp.headers;
	srvrHeaders["server"] = srvrHeaders["content-length"];
	srvrHeaders["transfer-encoding"] = "chunked";
	srvrHeaders["content-length"] = 0;
	resp.writeHead(srvrResp.statusCode, srvrHeaders);
	srvrResp.on('data', function (chunk) {
		// Add response data
		resp.write(chunk);
	});
	srvrResp.on('end', function() {
		// Complete response to proxy helper
		console.log("Server Response complete");
		if(srvrResp.trailers != null)
			resp.addTrailers(srvrResp.trailers);
		resp.end();
	});
}


// Process each user request
function onUserRequest(req, resp)
{
	// Log the request URL
	console.log("User Request: " + req.url);
	// Goto default page on relative URL
	if(req.url.indexOf("/proxy") < 0) {
		defaultPage(resp);
		return;
	}
	// Retrieve request URL
	console.log("Access URL: " + req.headers["user-agent"]);
	var urlName = req.headers["user-agent"];
	var hostName = url.parse(urlName).host;
	// Prepare options for the Server
	var reqHeaders = req.headers;
	reqHeaders["host"] = hostName;
	reqHeaders["user-agent"] = defUserAgent;
	var options = {
		"method": req.method,
		"host": hostName,
		"path": urlName,
		"port": 80,
		"headers": reqHeaders
	};
	console.log("Server Request started");
	var srvrReq = http.request(options, function (srvrResp) {
		onSrvrResponse(resp, srvrResp);
	});
	srvrReq.on('error', function(e) {
		console.log('Problem with request: ' + e.message);
	});
	var reqData = req.read();
	if(reqData != null)
		srvrReq.write(reqData);
	if(req.trailers != null)
		srvrReq.addTrailers(req.trailers);
	srvrReq.end();
	console.log("Server Request complete");
}


// create HTTP server on preferred port
http.createServer(onUserRequest).listen(port);
writeLog("Proxy started on port " + port);
