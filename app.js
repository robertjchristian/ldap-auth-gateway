// dependencies
var express = require('express'),
    httpProxy = require('http-proxy'),
    http = require('http'),
    ldap = require('ldapjs'),
    metrics = require('metrics');

// servers and server metrics
var GATEWAY_SERVER = { host: 'localhost', port: 8000 };
var AUTH_SERVER = { host: 'localhost', port: 9001 };
var TARGET_SERVER = { host: 'localhost', port: 9002 };
var METRICS_SERVER = { host: 'localhost', port: 9003 };

var gatewayRequests = new metrics.Timer;
var authRequests = new metrics.Timer;
var targetRequests = new metrics.Timer;


// utility methods

var fetchCookies = function(req) { 
  var cookies = {};
  // TODO use express or a known utils class for this
  req.headers.cookie && req.headers.cookie.split(';').forEach(function( cookie ) {
    var parts = cookie.split('=');
    cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
  });
  return cookies;
}

// ldap auth
var authenticate = function(req, callback) {

    var client = ldap.createClient({
        url: 'ldap://127.0.0.1:1389'
    });

    // TODO use url parse / cookie parse / express for this

    var header=req.headers['authorization']||'',        // get the header
        token=header.split(/\s+/).pop()||'',            // and the encoded auth token
        auth=new Buffer(token, 'base64').toString(),    // convert from base64
        parts=auth.split(/:/),                          // split on colon
        username=parts[0],
        password=parts[1];

    console.log('User:  ' + username + ", Password:  " + password);


    client.bind('cn=' + username, password, function(err) {

        if (err) {
            console.log('Err:  ' + err.code);
            callback(false);
        }  else {
            //client.unbind();
            console.log('Authenticated against LDAP');
            callback( true);
        }
    });
}





// 
// Proxy (Gateway) server
//

httpProxy.createServer(function (req, res, proxy) {

  gatewayRequests.update(1);

  var cookies = fetchCookies(req);  
  
  //console.log(req.headers);

  if (cookies['token'] && cookies['token'] == '12345678') {
    //console.log("Authenticated:  " + cookies['token']);
    
    // proxy requests to target
    proxy.proxyRequest(req, res, TARGET_SERVER);
    
  } else {
    // console.log("Not authenticated, redirecting to auth server.");
    
    // proxy request to authentication server
    proxy.proxyRequest(req, res, AUTH_SERVER);
    
  }


}).listen(GATEWAY_SERVER.port);


//
// Authentication server
//
http.createServer(function (req, res) {

    authRequests.update(1);

    authenticate(req, function(result) {
      console.log('result: ' + result);

        if (!result) {
            res.writeHead(200, { 'Content-Type': 'text/plain', 'Set-Cookie': 'token=' });
            res.write('Not authorized.');
            res.end();
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain', 'Set-Cookie': 'token=12345678' });
            res.write('Authorized.');
            res.end();
        }

    });
}).listen(AUTH_SERVER.port);


//
// Target server
//
http.createServer(function (req, res) {

  targetRequests.update(1);

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Echo service: ' + req.url + '\n' + JSON.stringify(req.headers, true, 2));
  res.write('\n');
  req.pipe(res);
  res.end();
  
}).listen(TARGET_SERVER.port);

//
// Metrics server
//
var metricsServer = new metrics.Server(METRICS_SERVER.port);
metricsServer.addMetric('targetRequests', targetRequests);
metricsServer.addMetric('authRequests', authRequests);
metricsServer.addMetric('gatewayRequests', gatewayRequests);