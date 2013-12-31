var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");
var port = 5001;

http.createServer(function(request, response) {

	var uri = url.parse(request.url).pathname;
	var filename = path.join(process.cwd(), uri);

	path.exists(filename, function(e) {
		if(!e) {
			response.writeHead(404, {"Content-Type":"text/plain"});
			response.end("404 - Not Found");
			return;
		}

	if (fs.statSync(filename).isDirectory()) filename += '/index.html';

	fs.readFile(filename, "binary", function(err, file) {
			if(err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(err + "\n");
				response.end();
				return;
			}
		response.writeHead(200);
		response.write(file, "binary");
		response.end();
		});

	});

}).listen(port, function() {
	console.log("Servidor respondendo HTTP estatico na porta 5000...");
});



