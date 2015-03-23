/* jshint devel:true */
(function() {

    var streamdata = null;
    var stocks = [];

    function init() {
        $('#connect').on('click', connect);
        $('#disconnect').on('click', disconnect);
        $('#disconnect').attr('disabled', 'disabled');

        $(document).ready(function() {
            $('#inputUrl').keyup(function() {
                var empty = false;
                $('#inputUrl').each(function() {
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

        // create the Streamdata source
        streamdata = streamdataio.createEventSource(url, header);

        streamdata.streamdataConfig.PROTOCOL = 'https://';
        streamdata.streamdataConfig.HOST = 'proxy.streamdata.io';
        streamdata.streamdataConfig.PORT = '';

        // add a callback when the connection is opened
        streamdata.onOpen(function() {
            $('#connect').attr('disabled', 'disabled');
            $('#disconnect').removeAttr('disabled');
        });

        // add a callback when data is sent by streamdata.io
        streamdata.onData(function(data) {
            stocks = data;
            renderStocks([]);
        });

        // add a callback when a patch is sent by streamdata.io
        streamdata.onPatch(function(patch) {
            // apply the json-patch to the array of values
            jsonpatch.apply(stocks, patch);

            // add areNew property to highlight changes
            stocks.map(function(item, index) {
                item.areNew = new Array();
            });
            patch.forEach(function(item) {
                var index = parseInt(item.path.substring(1, item.path.indexOf('/', 1)));
                var attribute = item.path.substring(item.path.indexOf('/', 1) + 1);
                // we keep only first level attribute
                if(attribute.indexOf('/') != -1) attribute = attribute.substring(0,attribute.indexOf('/'));
                switch(item.op) {
                    case "add":
                    case "replace":
                        stocks[index].areNew.push(attribute);
                        break;
                }
            });

            renderStocks();
        });

        // add a callback when an error occured
        streamdata.onError(function(error) {
            console.error('Received an error: ' + error.message);

            disconnect();

            $('#error').append(error.message);
            $('#error').removeClass('hide');

            setTimeout(function() {
                $('#error').empty();
                $('#error').addClass('hide');
            }, 5000);
        });

        streamdata.open();
    };

    function disconnect() {
        streamdata.close();
        $('#disconnect').attr('disabled', 'disabled');
        $('#connect').removeAttr('disabled');
    };


    function renderStocks() {

        $('#stocks').empty();

        // create header
        $('#stocks').append("<thead><tr></tr></thead");
        $.each(stocks[0], function(index, value) {
            // do not display areNew attribute
            if(index != "areNew") {
                $('#stocks thead tr').append('<td>' + index + '</td>');
            }
        });
        // create body
        $('#stocks').append("<tbody></tbody>");
        $.each(stocks, function(lineIndex, lineValue) {
            $('#stocks tbody').append("<tr></tr>");
            $.each(lineValue, function(cellIndex, cellValue) {
                var classNew = (lineValue.areNew && lineValue.areNew.indexOf(cellIndex) != -1) ? "success" : "";
                // do not display areNew attribute
                if(cellIndex != "areNew") {
                    $('#stocks tbody tr:last').append('<td class="' + classNew + '">' + cellValue + '</td>');
                }
            });
        });
    };

    init();

})();