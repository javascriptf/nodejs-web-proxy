var http = require("http");
var url = require("url");

var port = process.env.PORT;


// Default web page (Hello!)
function DefaultPage(resp)
{
	console.log("Default page accessed");
	resp.writeHead(200, {"content-type": "text/plain"});
	resp.write("wb_Proxy: Hello!");
	resp.end();
}


// Process server response
function OnServerResp(resp, srvrResp)
{
	// Begin reponse to proxy helper
	console.log("Server Response started");
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
	reqHeaders["user-agent"] = "Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/21.0";
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


// Create HTTP server on preferred port
http.createServer(onUserRequest).listen(port);
console.log("Proxy started on port " + port);
