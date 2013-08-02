<h1>ldap-auth-gateway</h1>

<h2>about</h2>

Provides a gateway pattern for centralizing the authorization and session management of incoming HTTP requests through a reverse proxy.  Authorization mechanism could be made pluggable since it is facaded by an auth service, but in the default implementation, I'm using a nodejs-based LDAP server (ldapjs).

<h2>dependencies</h2>
nodejs/npm

<h2>installation and startup</h2>

<ul>
<li>install dependencies with "npm install"</li>
<li>start ldap server with "node ldap.js"</li>
<li>in a separate terminal/process, start app with "node app.js"</li>
</ul>

<h2>working use cases</h2>

<h3>
Attempt to access target via gateway, no token, no basic auth
</h3>

<img src="http://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgYXR0ZW1wdCB0byByZWFjaCB0YXJnZXQgbm8gYXV0aCBoZWFkZXIKY2xpZW50LT5nYXRld2F5OiAgZ2V0L3Bvc3QKAAwHABELdG9rZW4_IChubykAFAphdXRoOgBPBQphdXRoAAkIcGFyc2UgYmFzaWMAZQwgKG5vAHUHKQApBwByCWZhaWwAQwYAcgkAgRkGAA8MCgoKCg&s=napkin" />

* title attempt to reach target no auth header
* client->gateway:  get/post
* gateway->gateway: token? (no)
* gateway->auth: auth
* auth->auth: parse basic auth header (no header)
* auth->gateway: fail auth
* gateway->client: fail auth

<h3>
attempt to access target via gateway - no token, basic auth (invalid creds)
</h3>

<img src="http://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgYXR0ZW1wdCB0byByZWFjaCB0YXJnZXQsIGF1dGggaGVhZGVyIChpbnZhbGlkKQpjbGllbnQtPmdhdGV3YXk6ICBnZXQvcG9zdAoADAcAEQt0b2tlbj8gKG5vKQAUCmF1dGg6AFkFCmF1dGgACQhwYXJzZSBiYXNpYwBtDm9rYXkpACQHbGRhcAA2BiB2aWEgbGRhcCAoYmluZCkKbGRhcAAZCHNlcnZlci5iaW5kKGNyZWRzABcIAHYGZmFpbAB1BwCBPglmYWlsAIEPBgCBPgkAgWUGAA8MCgoK&s=napkin" />

* title attempt to reach target, auth header (invalid)
* client->gateway:  get/post
* gateway->gateway: token? (no)
* gateway->auth: auth
* auth->auth: parse basic auth header (okay)
* auth->ldap: auth via ldap (bind)
* ldap->ldap: server.bind(creds)
* ldap->auth: fail
* auth->gateway: fail auth
* gateway->client: fail auth

<h3>
attempt to access target via gateway, valid creds
</h3>

<img src="http://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgYXR0ZW1wdCB0byByZWFjaCB0YXJnZXQsIGF1dGggaGVhZGVyICh2YWxpZCkKY2xpZW50LT5nYXRld2F5OiAgZ2V0L3Bvc3QKAAwHABELdG9rZW4_IChubykAFAphdXRoOgBXBQphdXRoAAkIcGFyc2UgYmFzaWMAaw5va2F5KQAkB2xkYXAANgYgdmlhIGxkYXAgKGJpbmQpCmxkYXAAGQhzZXJ2ZXIuYmluZChjcmVkcwAXCAB2BnN1Y2NlZWQAeAcAgUEJAIFqBQAXBXNzIQCBRAoAgWwGABEOLCBzZXQAgVkGIChjb29raWUp&s=napkin" />

* title attempt to reach target, auth header (valid)
* client->gateway:  get/post
* gateway->gateway: token? (no)
* gateway->auth: auth
* auth->auth: parse basic auth header (okay)
* auth->ldap: auth via ldap (bind)
* ldap->ldap: server.bind(creds)
* ldap->auth: succeed
* auth->gateway: auth success!
* gateway->client: auth success, set token (cookie)

<h3>
attempt to access target via gateway, valid token
</h3>

<img src="http://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgYXR0ZW1wdCB0byByZWFjaCB0YXJnZXQsICh2YWxpZCB0b2tlbikKY2xpZW50LT5nYXRld2F5OiAgZ2V0L3Bvc3QKAAwHABELAC8FPyAoeWVzISkAFgoAVAY6IHByb3h5IHJlcXVlc3QKAGoGABQKZWNobyByZXNwb25zZQAVCQBvCQA1CAAZBwB0CQCBGwY6AIE4BydzADoJ&s=napkin" />

* title attempt to reach target, (valid token)
* client->gateway:  get/post
* gateway->gateway: token? (yes!)
* gateway->target: proxy request
* target->target: echo response
* target->gateway: proxy response
* gateway->client: target's response

<h2>Example usage<h2>

<i>TODO:  Elaborate exampleusage with better documentation, and the below script actually won't work... make host configurable and change Basic auth to use "root"/"secret" as that's the only cred that will work out of the box.</i>

<h5>Examples - test.sh</h5>
<pre>
#!/bin/bash

while true
  do

  printf "\n\nRequest target through proxy with valid session...\n"
  curl -X POST -d "foofoofoo" --header "Cookie:  token=12345678" host:8000

  printf "\n\nRequest target through proxy with invalid auth credentials...\n"
  curl --header "Authorization:  Basic cm9iOnJvYg==" host:8000

  printf "\n\nRequest target through proxy with invalid auth credentials...\n"
  curl --header "Authorization:  Basic fail" host:8000

  exit
done  

</pre>

