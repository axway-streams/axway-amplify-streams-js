/* jshint devel:true */
(function ()
{

  function AppController($scope, $log, $timeout)
  {
    const appCtrl = this;
    appCtrl.isPatching = false;
    appCtrl.headers = [];
    appCtrl.url = 'http://stockmarket.streamdata.io/prices';
    appCtrl.isConnected = false;
    appCtrl.errorMsg = null;

    let streamdata = null;

    appCtrl.popupPk = {
      content: 'An application token is required for authentication. <a href="https://portal.streamdata.io/#/register" target="_blank">Sign Up</a> to get yours.',
      options: {
        title    : null,
        placement: 'left',
        html     : true,
        delay    : {show: 0, hide: 1500}
      }
    };
    appCtrl.popupHeaders = {
      content: 'Add any custom HTTP Header (optional)',
      options: {
        title    : null,
        placement: 'left',
        html     : true,
        delay    : {show: 0, hide: 0}
      }
    };
    appCtrl.popupSignature = {
      content: 'Sign your request with your application private key.',
      options: {
        title    : null,
        placement: 'left',
        html     : true,
        delay    : {show: 0, hide: 0}
      }
    };

    appCtrl.addHeader = function ()
    {
      appCtrl.headers.push({name: "", value: ""});
    };

    appCtrl.removeHeader = function (index)
    {
      appCtrl.headers.splice(index, 1);
      appCtrl.headersToArray();
    };

    appCtrl.headersToArray = function ()
    {
      const out = [];
      appCtrl.headers.forEach((header) =>
      {
        out.push(header.name + ":" + header.value);
      });
      return out;
    };

    appCtrl.connect = function ()
    {
      $log.info('Opening streamdataio connection with the url: ' + appCtrl.url);

      // extract headers
      let headers = [];

      if (appCtrl.headers.length > 0 && appCtrl.headers[0].name !== "" && appCtrl.headers[0].value !== "") {
        headers = appCtrl.headersToArray(appCtrl.headers);
      }

      let signatureStrategy = null;
      if (typeof AuthStrategy !== 'undefined' && appCtrl.signature) {
        // signature checkbox is checked: setup a signatureStrategy
        signatureStrategy = AuthStrategy.newSignatureStrategy(appCtrl.token, appCtrl.pk);
      }

      // create the Streamdata source
      streamdata = streamdataio.createEventSource(appCtrl.url, appCtrl.token, headers, signatureStrategy);

      // add a callback when the connection is opened
      streamdata.onOpen(() =>
      {
        $log.info('Connection is opened');
        appCtrl.datas = [];
        appCtrl.isConnected = true;
      });

      // add a callback when data is sent by streamdata.io
      streamdata.onData((datas) =>
      {
        $log.info('Received datas:' + JSON.stringify(datas));
        $scope.$apply(() =>
        {
          appCtrl.datas = datas;
        });
      });

      // add a callback when a patch is sent by streamdata.io
      streamdata.onPatch((patch) =>
      {
        $scope.$apply(() =>
        {
          if (!appCtrl.isPatching) {
            $log.info('Received patch:' + JSON.stringify(patch));
            appCtrl.isPatching = true;
            // apply the json-patch to the array of values
            jsonpatch.applyPatch(appCtrl.datas, patch);
            appCtrl.isPatching = false;
          }
        });
      });

      // add a callback when an error occured
      streamdata.onError((error) =>
      {
        $scope.$apply(() =>
        {
          $log.error('Received an error: ' + error.message);
          appCtrl.disconnect();
          appCtrl.errorMsg = error.message;
          $timeout(function ()
          {
            appCtrl.errorMsg = null;
          }, 3000);
        });

      });

      // open the streamdata.io connection
      streamdata.open();
    };

    appCtrl.disconnect = () =>
    {
      $log.info('Closing the connection of streamdataio');

      streamdata && streamdata.close();
      appCtrl.isConnected = false;
      appCtrl.isPatching = false;
    };

  }

  angular
    .module('app', ['ngSanitize', 'ngMaterial'])
    .config(function ($mdThemingProvider)
    {
      $mdThemingProvider.theme('default')
        .primaryPalette('deep-purple')
        .accentPalette('amber')
        .warnPalette('red')
        .backgroundPalette('grey');
    })
    .controller('AppController', ['$scope', '$log', '$timeout', AppController])
    .directive('popup', function ()
    {
      return {
        restrict: 'A',
        require : 'ngModel',
        scope   : {
          ngModel: '=',
          options: '=popup'
        },
        link    : function (scope, element)
        {
          scope.$watch('ngModel', function (val)
          {
            element.attr('data-content', val);
          });

          const options = scope.options || {};

          const title = options.title || null;
          const placement = options.placement || 'right';
          const html = options.html || false;
          const delay = options.delay ? angular.toJson(options.delay) : null;
          const trigger = options.trigger || 'hover';

          element.attr('title', title);
          element.attr('data-placement', placement);
          element.attr('data-html', html);
          element.attr('data-delay', delay);
          element.popover({trigger: trigger});
        }
      };
    });
})();
