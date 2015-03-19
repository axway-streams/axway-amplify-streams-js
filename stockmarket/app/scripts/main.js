/* jshint devel:true */
(function() {

var streamdata = null;
var stocks = [];

function init() {
  $('#connect').on('click', connect);
  $('#disconnect').on('click', disconnect);

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

    var indexes = patch.map(function(item) {
      var path = item.path;
      var idx = path.indexOf('/', 1);
      return parseInt(path.substring(1, idx));
    });

    renderStocks(indexes);
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


function renderStocks(updates) {
  updates = updates || [];

  if (updates.length === 0) {
    // call from onData(.): first data sent
    $('#stocks tbody').empty();

  }

  for (i = 0, l = stocks.length; i < l; i++) {
   if ($.inArray(i, updates) === -1) {
      var stock = $('#stocks #' + i);
      if (stock.length === 0) {
        $('#stocks').append('<tr id="' + i + '">'
                 + '<td>' + stocks[i].title + '</td>'
                 + '<td>' + stocks[i].price + '</td>'
                 + '</tr>');

      } else {
        stock.removeClass('success');

      }

   } else {
      $('#stocks #' + i).replaceWith(
          '<tr id="' + i + '" class="success">'
            + '<td>' + stocks[i].title + '</td>'
            + '<td>' + stocks[i].price + '</td>'
            + '</tr>'
      );
   }
  }
};

init();

})();