var http = require('http'),
    net = require('net'),
    httpProxy = require('http-proxy'),
    url = require('url');

var err_esc_red = '\x1B[31m';
var err_esc_green = '\x1B[32m';
var err_esc_black = '\x1B[0m';

var blacklist = new Set();
blacklist.add('http://hire.meehan.co/');

var proxy = httpProxy.createServer({ws: true, prependPath: false});

var server = http.createServer(function (req, res) {
  if (blacklist.has(req.url)){
    console.log(err_esc_green + 'Blocked request to blacklisted site: ' + req.url + err_esc_black);
    res.writeHead(401, {'Content-Type': 'text/plain'});
    res.write('Access to blacklisted site denied.\n' + req.url + '\n');
    res.end();
  }
  else {
    console.log('Req for: ' + req.url);
    proxy.web(req, res, {target: req.url, secure: false},
              function(e){
                if(e){
                  console.error(err_esc_red + 'Something bad happened, let\'s not worry about it just yet...' + err_esc_black)
                }
              }
             );
  }
}).listen(8080);

server.on('connect', function (req, socket) {
  console.log('Con req for:' + req.url);

  var serverUrl = url.parse('https://' + req.url);

  var srvSocket = net.connect(serverUrl.port, serverUrl.hostname, function() {
    socket.write('HTTP/1.1 200 Connection Established\r\n' + '\r\n');
    srvSocket.pipe(socket);
    socket.pipe(srvSocket);
  });
});

server.on('error', function(e){
  console.error(err_esc_red + 'Server error, pls forgib many grievance' + err_esc_black);
});

process.on('uncaughtException', function (err) {
  console.error(err_esc_red + 'TCP protocol error: ' + err.stack.split('\n')[0] + err_esc_black);
});
