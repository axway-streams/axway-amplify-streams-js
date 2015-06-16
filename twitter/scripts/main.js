/* jshint devel:true */
(function () {
    var streamdata = null;
    var tweets = [];

   /*
    * Form validation
    */
    function checkForm () {
        if($('#cbPrivateKey').is(":checked")){
            $(".pkdiv").show();
            $(".privateKeyValue").attr("required", true);
        }
        else {
            $(".pkdiv").hide();
            $(".privateKeyValue").attr("required", false);
        }

        var empty = $('#inputUrl').val().length === 0 || $('#inputAppToken').val().length === 0 || ($('#inputPrivateKey').val().length === 0 && $('#cbPrivateKey').is(":checked") ) ;
        empty ? $('#connect').attr('disabled', 'disabled') : $('#connect').removeAttr('disabled');
    }

    function init() {
        $('#connect').on('click', connect);
        $('#disconnect').hide();
        $('#disconnect').on('click', disconnect);
        $('#cbPrivateKey').on('click', checkForm);
        $('#inputUrl, #inputAppToken, #inputPrivateKey').on('input', checkForm);
        checkForm();

        $(document).ready(function () {
            $('#inputUrl').keyup(function () {

                var empty = false;
                $('#inputUrl').each(function () {
                    if ($(this).val().length == 0) {
                        empty = true;
                    }
                });

                if (empty) {
                    $('#connect').attr('disabled', 'disabled');
                    console.log('empty');
                } else {
                    $('#connect').removeAttr('disabled');
                    console.log('not empty');
                }
            });

        });
    };

    function connect() {
        var url = $('#inputUrl').val();
        var headerValue = $.trim($('#inputHeader').val());
        var header = [];

        if (headerValue !== null && headerValue.length > 0) {
            header = [headerValue];

        }

        var appToken = $('#inputAppToken').val();
        var privateKey = $('#inputPrivateKey').val();

        // setup a signatureStrategy
        var signatureStrategy;
        if (typeof AuthStrategy === 'undefined') {
            signatureStrategy = null;
        } else {
            if ($('#cbPrivateKey').is(":checked")) {
                // signature checkbox is checked: setup a signatureStrategy
                signatureStrategy = AuthStrategy.newSignatureStrategy(appToken, privateKey);
            } else {
                signatureStrategy = null;
            }
        }

        // create the streamdata.io source
        streamdata = streamdataio.createEventSource(url, appToken, header,signatureStrategy);

        // add a callback when the connection is opened
        streamdata.onOpen(function () {
          $('#disconnect').show();
          $('#connect').hide();
        });

        // add a callback when data is sent by streamdata.io
        streamdata.onData(function (data) {
            tweets = data;
            renderTweets([]);
        });

        // add a callback when a patch is sent by streamdata.io
        streamdata.onPatch(function (patch) {
            // apply the json-patch to the array of values
            jsonpatch.apply(tweets, patch);

            var indexes = patch.map(function (item) {
                var path = item.path;
                var idx = path.indexOf('/', 1);
                return parseInt(path.substring(1, idx));
            });

            renderTweets(indexes);
        });

        // add a callback when an error occured
        streamdata.onError(function (error) {
            console.error('Received an error: ' + error.message);

            disconnect();

            $('#error').append(error.message);
            $('#error').removeClass('hide');

            setTimeout(function () {
                $('#error').empty();
                $('#error').addClass('hide');
            }, 5000);
        });

        streamdata.open();

    };

    function disconnect() {
      streamdata.close();
      tweets = [];
      $('#connect').show();
      $('#disconnect').hide();
    };

    function renderTweets(updates) {
        updates = updates || [];

        if (updates === []) {
            // call from onData(.): first data sent
            $('#tweets tbody').empty();

        }

        for (i = 0, l = tweets.length; i < l; i++) {
            if ($.inArray(i, updates) === -1) {
                var tweet = $('#tweets #' + i);
                if (tweet.length === 0) {
                    $('#tweets').append('<tr id="' + i + '">'
                    + '<td>' + tweets[i].text + '</td>'
                    + '<td>' + tweets[i].user.followers_count + '</td>'
                    + '<td>' + tweets[i].retweet_count + '</td>'
                    + '</tr>');

                } else {
                    tweet.removeClass('success');

                }

            } else {
                $('#tweets #' + i).replaceWith(
                    '<tr id="' + i + '" class="success">'
                    + '<td>' + tweets[i].text + '</td>'
                    + '<td>' + tweets[i].user.followers_count + '</td>'
                    + '<td>' + tweets[i].retweet_count + '</td>'
                    + '</tr>'
                );
            }
        }
    };

    init();
})();
