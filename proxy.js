var http = require('http'),
    net = require('net'),
    httpProxy = require('http-proxy'),
    url = require('url'),
    ws = require('ws'),
    express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs');


// CacheDir creation, if not exists //

var cachedir = __dirname + '/cache/';

fs.stat(cachedir, function(err, stats){
  if (err) {
    if (err.code === 'ENOENT') {
      fs.mkdir(cachedir, function(err){
        if (err) throw err;
        else {
          console.log('created cachedir at ' + cachedir);
        }
      });
    }
    else throw err;
  }
  else {
    console.log(cachedir + ' being used as cachedir');
  }
});


// Cache Control //

var cache = {cacheSeed: 0};

var isCached = function(url, callback) {
  if (cache.hasOwnProperty(url)){
    if(cache[url].date > new Date()){
      callback(true);
    }
    else {
      // cached data has expired
      fs.unlink(cachedir + cache[url].id, function(e){
        if (e) {
          console.log('couldn\'t delete file');
          throw e;
        }
        delete cache[url];
        callback(false);
      });
    }
  }
  else {
    // page was not previously cached
    callback(false);
  }
};



// Websocket Driven Console //

var WebSocketServer = ws.Server
  , wss = new WebSocketServer({ port: 8008 });

wss.on('connection', function connection(websocket) {
  websocket.send('Connected to Node Proxy Websocket Console - Peter Meehan - 13318021');
});
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};


// Express Resuful API //

var blacklist = new Set();
blacklist.add('http://hire.meehan.co/');
blacklist.add('www.facebook.com:443');
blacklist.add('facebook.com:443');

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.listen(8000);

//blacklist endpoints
app.get('/blacklist', function(req, res) {
  res.json(Array.from(blacklist));
});

app.post('/blacklist', function(req, res) {
  var url = req.body.site;
  if(url[4] === 's'){
    url = url.substring(8);
    if (url.slice(-1) === '/'){
      url = url.substring(0,url.length-1);
    }
    url += ':443';
  }
  blacklist.add(url);
  res.json(Array.from(blacklist));
});

app.delete('/blacklist/*', function(req, res) {
  blacklist.delete(req.params[0]);
  res.json(Array.from(blacklist));
});

app.get('*', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});


// Blacklist Logic

var blacklisted = function (site, callback){
  var found = false;
  blacklist.forEach(function each(b_site) {
    if (site.indexOf(b_site) === 0){
      callback(true);
      found = true;
    }
  });
  if (found) { return; }
  callback(false);
}


// Proxy Server //

var proxy = httpProxy.createServer({ws: true, prependPath: false});

var server = http.createServer(function (req, res) {
  blacklisted(req.url, function(bool) {
    if (bool){
      wss.broadcast('Blocked request to blacklisted site: ' + req.url);
      res.writeHead(401, {'Content-Type': 'text/plain'});
      res.write('Access to blacklisted site denied.\n' + req.url + '\n');
      res.end();
    }
    else {
      isCached(req.url, function(inCache){
        //if (inCache) {
        //  wss.broadcast('serving cached version of: ' + req.url);
          //fs.createReadStream(cachedir + cache[req.url].id).pipe(res);
          //res.end();
        //}
        //else {
          wss.broadcast(req.url);
          proxy.web(req, res, {target: req.url, secure: false});
       // }
      });
    }
  });
}).listen(8080);


proxy.on('proxyRes', function(proxyRes, req, res) {
  cache[req.url] = {date: new Date(new Date().getTime()+(10*60*1000)),
    id: cache.cacheSeed++}
    proxyRes.pipe(fs.createWriteStream(cachedir + cache[req.url].id));
});

server.on('connect', function (req, socket) {
  blacklisted(req.url, function(bool) {
    if (bool) {
      wss.broadcast('Blocked CON request to blacklisted site: ' + req.url);
      socket.end('HTTP/1.1 403 Forbidden\r\n' + '\r\n');
    }
    else {
      wss.broadcast(req.url);
      var serverUrl = url.parse('https://' + req.url);
      var srvSocket = net.connect(serverUrl.port, serverUrl.hostname, function() {
        socket.write('HTTP/1.1 200 Connection Established\r\n' + '\r\n');
        srvSocket.pipe(socket);
        socket.pipe(srvSocket);
      });
    }
  });
});

// explicit tcp error handling
process.on('uncaughtException', function (e) {
  var pre = e.stack.split('\n')[0];
  if (pre.includes('ECONNRESET') || pre.includes('ECONNREFUSED') || pre.includes('ENOTFOUND')) {
    console.error('TCP ' + pre);
  }
  else if (pre.includes('socket hang up')){
    console.error(pre);
  }
  else{
    throw e;
  }
});
