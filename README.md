<h1>ldap-auth-gateway</h1>

<b>Note: This is a minimum viable product... that said, it works!</b>

<h2>about</h2>

Provides a gateway pattern for centralizing the authorization and session management of incoming HTTP requests through a reverse proxy.  Authorization mechanism could be made pluggable since it is facaded by an auth service, but in the default implementation, I'm using a nodejs-based LDAP server (ldapjs).

<h2>dependencies</h2>
nodejs/npm

<h2>installation</h2>

install:
<pre>
➜  ldap-auth-gateway git:(master) npm install
</pre>

start ldap:
<pre>
➜  ldap-auth-gateway git:(master) node ldap.js
</pre>

start remaining services:
<pre>
➜  ldap-auth-gateway git:(master) node app.js
</pre>

<h2>working use cases</h2>

<h3>
Attempt to access target via gateway, no token, no basic auth
</h3>

<img src="http://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgYXR0ZW1wdCB0byByZWFjaCB0YXJnZXQgbm8gYXV0aCBoZWFkZXIKY2xpZW50LT5nYXRld2F5OiAgZ2V0L3Bvc3QKAAwHABELdG9rZW4_IChubykAFAphdXRoOgBPBQphdXRoAAkIcGFyc2UgYmFzaWMAZQwgKG5vAHUHKQApBwByCWZhaWwAQwYAcgkAgRkGAA8MCgoKCg&s=napkin" />

<pre>
title attempt to reach target no auth header
client->gateway:  get/post
gateway->gateway: token? (no)
gateway->auth: auth
auth->auth: parse basic auth header (no header)
auth->gateway: fail auth
gateway->client: fail auth
</pre>

<h3>
attempt to access target via gateway - no token, basic auth (invalid creds)
</h3>

<img src="http://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgYXR0ZW1wdCB0byByZWFjaCB0YXJnZXQsIGF1dGggaGVhZGVyIChpbnZhbGlkKQpjbGllbnQtPmdhdGV3YXk6ICBnZXQvcG9zdAoADAcAEQt0b2tlbj8gKG5vKQAUCmF1dGg6AFkFCmF1dGgACQhwYXJzZSBiYXNpYwBtDm9rYXkpACQHbGRhcAA2BiB2aWEgbGRhcCAoYmluZCkKbGRhcAAZCHNlcnZlci5iaW5kKGNyZWRzABcIAHYGZmFpbAB1BwCBPglmYWlsAIEPBgCBPgkAgWUGAA8MCgoK&s=napkin" />

<pre>
title attempt to reach target, auth header (invalid)
client->gateway:  get/post
gateway->gateway: token? (no)
gateway->auth: auth
auth->auth: parse basic auth header (okay)
auth->ldap: auth via ldap (bind)
ldap->ldap: server.bind(creds)
ldap->auth: fail
auth->gateway: fail auth
gateway->client: fail auth
</pre>

<h3>
attempt to access target via gateway, valid creds
</h3>

<img src="http://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgYXR0ZW1wdCB0byByZWFjaCB0YXJnZXQsIGF1dGggaGVhZGVyICh2YWxpZCkKY2xpZW50LT5nYXRld2F5OiAgZ2V0L3Bvc3QKAAwHABELdG9rZW4_IChubykAFAphdXRoOgBXBQphdXRoAAkIcGFyc2UgYmFzaWMAaw5va2F5KQAkB2xkYXAANgYgdmlhIGxkYXAgKGJpbmQpCmxkYXAAGQhzZXJ2ZXIuYmluZChjcmVkcwAXCAB2BnN1Y2NlZWQAeAcAgUEJAIFqBQAXBXNzIQCBRAoAgWwGABEOLCBzZXQAgVkGIChjb29raWUp&s=napkin" />

<pre>
title attempt to reach target, auth header (valid)
client->gateway:  get/post
gateway->gateway: token? (no)
gateway->auth: auth
auth->auth: parse basic auth header (okay)
auth->ldap: auth via ldap (bind)
ldap->ldap: server.bind(creds)
ldap->auth: succeed
auth->gateway: auth success!
gateway->client: auth success, set token (cookie)
</pre>

<h3>
attempt to access target via gateway, valid token
</h3>

<img src="http://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgYXR0ZW1wdCB0byByZWFjaCB0YXJnZXQsICh2YWxpZCB0b2tlbikKY2xpZW50LT5nYXRld2F5OiAgZ2V0L3Bvc3QKAAwHABELAC8FPyAoeWVzISkAFgoAVAY6IHByb3h5IHJlcXVlc3QKAGoGABQKZWNobyByZXNwb25zZQAVCQBvCQA1CAAZBwB0CQCBGwY6AIE4BydzADoJ&s=napkin" />

<pre>
title attempt to reach target, (valid token)
client->gateway:  get/post
gateway->gateway: token? (yes!)
gateway->target: proxy request
target->target: echo response
target->gateway: proxy response
gateway->client: target's response
</pre>

<h2>Example usage<h2>

Examples assume running on localhost....

<h5>Use case:  Invalid basic auth, no existing session</h5>
User attempts to access target through gateway with no session and no (or invalid) auth credentials.
<pre>
➜  ~  curl --header "Authorization:  Basic cm9iOnJvYg==" localhost:8000
Not authorized.
</pre>

<h5>Use case:  Valid basic auth, no existing session</h5>
User attempts to access target through gateway with no session and valid auth credentials (login: root, password: secret).
<pre>
➜  ~  curl --header "Authorization:  Basic cm9vdDpzZWNyZXQ=" localhost:8000
Authorized.
</pre>

<h5>Use case:  User has a valid session after successful authorization</h5>
Here, simple token is validated and forwarded to an echo service.  Not the x headers indicating the forward.  Note, roadmap item will include client-based secure sessions with TTL... likely via the Express Framework.
<pre>
➜  ~  curl -X POST -d "foo" --header "Cookie:  token=12345678" localhost:8000
Echo service: /
{
  "user-agent": "curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8x zlib/1.2.5",
  "host": "localhost:8000",
  "accept": "*/*",
  "cookie": "token=12345678",
  "content-length": "9",
  "content-type": "application/x-www-form-urlencoded",
  "x-forwarded-for": "127.0.0.1",
  "x-forwarded-port": "52581",
  "x-forwarded-proto": "http",
  "connection": "keep-alive"
}foo
</pre>

<h2>Roadmap</h2>

* Make auth a service call from gateway to auth, rather than a proxy.
* Move token check into auth proxy so that all auth session logic is handled here... making gateway rely on auth completely.
* Fix home grown parsing of cookies/basic auth.  Likely using Express framework.
* Back LDAP with a user seed file, and offer a non-memory based alternative, ie backed by RIAK.
* Move port and other config to a config file.
