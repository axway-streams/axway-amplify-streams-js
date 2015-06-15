# streamdataio-js/twitter
This sample application shows how to get a Twitter timeline with the <a href="http://streamdata.io" target="_blank">streamdata.io</a> Javascript SDK and JQuery.

The streamdata.io SDK allows the use of streamdata.io to get data pushed from various sources and use them in your application.

To run the sample, open the index.html in your browser (Chrome, Firefox, Safari, IE > 10).

You will be asked to fill in your application Token. To get them, connect to the <a href="https://portal.streamdata.io/" target="_blank">streamdata.io portal</a> and follow the guidelines.

You will also be asked to fill in your Twitter OAuth signature (as a HTTP header) for the Twitter url you use in the sample. To get the signature:
- log in with your Twitter account to https://apps.twitter.com
- select your Twitter App or create one
- click on the « Test OAuth » button
- fill in the field « Request URI » with the Twitter url to be used in the sample (the sample default one is:  https://api.twitter.com/1.1/statuses/home_timeline.json)
- click on « Get OAuth Signature »
- copy the generated « Authorization header » (```Authorization: OAuth oauth_consumer_key=... oauth_version="1.0"```) and paste it into the input of the sample named « Twitter Authorization Header »
- click on the button « Connect »

Note that Twitter limits the number of API requests (see <a href="https://dev.twitter.com/rest/public/rate-limiting" target="_blank">Twitter doc</a> for more information). So, you might reach this limit after a while.

If you have any questions or feedback, feel free to ask: <a href="mailto://support@streamdata.io">support@streamdata.io</a>

Enjoy!
