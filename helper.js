var http = require("http");

var port = 8080;
var proxyHost = "wbproxy-11120.onmodulus.net";
var proxyPort = 80;
var proxyPath = "/proxy";


// Default web page (Hello!)
function defaultPage(resp) {
	console.log("Default page accessed");
	resp.writeHead(200, {"content-type": "text/plain"});
	resp.write("wb_ProxyHelper: Hello!");
	resp.end();
}


// Process server response
function onProxyResponse(resp, proxyResp) {
	// Begin reponse to user
	console.log("Proxy Response started");
	console.log("Proxy Status: " + proxyResp.statusCode);
	var proxyHeaders = proxyResp.headers;
	proxyHeaders["content-length"] = proxyHeaders["server"];
	proxyHeaders["server"] = "Server: Apache/2.4.1 (Unix)";
	resp.writeHead(proxyResp.statusCode, proxyHeaders);
	proxyResp.on('data', function (chunk) {
		// Add response data
		resp.write(chunk);
	});
	proxyResp.on('end', function() {
		// Complete response to user
		console.log("Server Response complete");
		if(proxyResp.trailers != null)
			resp.addTrailers(proxyResp.trailers);
		resp.end();
	});
}


// Process each user request
function onUserRequest(req, resp) {
	// Log the request URL
	console.log("Local Request: " + req.url);
	// Goto default page on relative URL
	if(req.url.indexOf("://") < 0) {
		defaultPage(resp);
		return;
	}
	// Prepare options for the Proxy
	var srvrHeaders = req.headers;
	srvrHeaders["host"] = proxyHost;
	srvrHeaders["user-agent"] = req.url;
	var options = {
		"method": req.method,
		"host": proxyHost,
		"path": proxyPath,
		"port": proxyPort,
		"headers": srvrHeaders
	};
	// Begin send request to Proxy
	console.log("Proxy Request started");
	var proxyReq = http.request(options, function (proxyResp) {
		onProxyResponse(resp, proxyResp);
	});
	// On error, report
	proxyReq.on('error', function(e) {
		console.log('Problem with request: ' + e.message);
	});
	// Send user data to Proxy
	var reqData = req.read();
	if(reqData != null)
		proxyReq.write(reqData);
	// Send trailer headers to Proxy
	if(req.trailers != null)
		proxyReq.addTrailers(req.trailers);
	// Complete Proxy request
	proxyReq.end();
	console.log("Proxy Request complete");
}


// Create Proxy helper server on preferred port
http.createServer(onUserRequest).listen(port);
console.log("Proxy helper started on port " + port);
