/*
 Copyright 2016 Streamdata.io

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// add EventSource dependency
var streamdataio = require('streamdataio-js-sdk/dist/bundles/streamdataio-node');
var AuthStrategy = require('streamdataio-js-sdk-auth');
// add json patch dependency
var JsonPatch = require('fast-json-patch');

function server()
{
  // targetUrl is the JSON API you wish to stream
  // you can use this example API which simulates updating stocks prices from a financial market
  var targetUrl = 'http://stockmarket.streamdata.io/prices';

  // appToken is the way Streamdata.io authenticates you as a valid user.
  // you MUST provide a valid token for your request to go through.
  var appToken = '[YOUR_STREAMDATAIO_APP_TOKEN]';
  var privateKey = '[YOUR_STREAMDATAIO_APP_PRIVATE_KEY]';

  eventSource =
    streamdataio.createEventSource(targetUrl, appToken, [], AuthStrategy.newSignatureStrategy(appToken, privateKey));
  var result = [];

  eventSource
  // the standard 'open' callback will be called when connection is established with the server
    .onOpen(function ()
    {
      console.log("connected!");
    })
    // the streamdata.io specific 'data' event will be called when a fresh Json data set
    // is pushed by Streamdata.io coming from the API
    .onData(function (data)
    {
      console.log("data received");
      // memorize the fresh data set
      result = data;

    })
    // the streamdata.io specific 'patch' event will be called when a fresh Json patch
    // is pushed by streamdata.io from the API. This patch has to be applied to the
    // latest data set provided.
    .onPatch(function (patch)
    {
      // display the patch
      console.log("patch: %o", patch);
      // apply the patch to data using json patch API
      JsonPatch.apply(result, patch);
      // do whatever you wish with the update data
      console.log("data: %o", data);

    })

    // the standard 'error' callback will be called when an error occur with the evenSource
    // for example with an invalid token provided
    .onError(function (error)
    {
      console.log('ERROR!', error);
      eventSource.close();

    });

  eventSource.open();

}

console.log('starting');
server();

