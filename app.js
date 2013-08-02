// dependencies
var express = require('express'),
    httpProxy = require('http-proxy'),
    http = require('http'),
    ldap = require('ldapjs');

var numAuthRequests = 0;
var numProxyRequests = 0;
var numTargetRequests = 0;

// utility methods

var start = process.hrtime();

var elapsed_time = function(note){
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
    console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message + time
    //start = process.hrtime(); // reset the timer
}

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
// Proxy server on 8000
//

var server = httpProxy.createServer(function (req, res, proxy) {


  elapsed_time("Total requests:  " + (numProxyRequests + numTargetRequests + numAuthRequests));

  console.log("Total proxy requests:  " + ++numProxyRequests);

  var cookies = fetchCookies(req);  
  
  //console.log(req.headers);

  if (cookies['token'] && cookies['token'] == '12345678') {
    //console.log("Authenticated:  " + cookies['token']);
    
    // proxy requests to target
    proxy.proxyRequest(req, res, { host: 'localhost', port: 9002 });
    
  } else {
    // console.log("Not authenticated, redirecting to auth server.");
    
    // proxy request to authentication server
    proxy.proxyRequest(req, res, { host: 'localhost', port: 9001 });
    
  }


});
server.listen(8000);


//
// Dummy authentication server on port 9001
//
http.createServer(function (req, res) {
  
   console.log("Total auth requests:  " + ++numAuthRequests);
  
   var authenticated = null;

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
}).listen(9001);


//
// Dummy target server on port 9002 (echo request)
//
http.createServer(function (req, res) {

  res.writeHead(200, { 'Content-Type': 'text/plain' });

  res.write('Echo service: ' + req.url + '\n' + JSON.stringify(req.headers, true, 2));

  req.pipe(res);

  //res.end();
  
}).listen(9002);
