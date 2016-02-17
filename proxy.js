var http = require('http'),
    net = require('net'),
    httpProxy = require('http-proxy'),
    url = require('url');

var proxy = httpProxy.createServer();

var server = http.createServer(function (req, res) {
  console.log('Request for ' + req.url);

  proxy.web(req,
            res,
            {target: req.url, secure: true},
            function(e){
              console.log("\x1B[31m" + "Error: let's just ignore it for now" + "\x1B[0m");
            }
           );
}).listen(8080);

server.on('connect', function (req, socket) {
  console.log('Request for ' + req.url);

  var serverUrl = url.parse('https://' + req.url);

  var srvSocket = net.connect(serverUrl.port, serverUrl.hostname, function() {
    socket.write('HTTP/1.1 200 Connection Established\r\n' +
    '\r\n');
    srvSocket.pipe(socket);
    socket.pipe(srvSocket);
  });
});
