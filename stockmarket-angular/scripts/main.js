/* jshint devel:true */
(function () {

  function AppController($scope, $log, $timeout) {
    const appCtrl = this;
    appCtrl.isPatching = false;
    appCtrl.url = 'http://stockmarket.streamdata.io/v2/prices';
    appCtrl.isConnected = false;
    appCtrl.errorMsg = null;

    let subscriber = null;

    appCtrl.popupPk = {
      content: 'An application subscriber key is required for authentication. <a href="https://portal.streamdata.io/#/register" target="_blank">Sign Up</a> to get yours.',
      options: {
        title: null,
        placement: 'left',
        html: true,
        delay: {show: 0, hide: 1500}
      }
    };

    appCtrl.connect = function () {
      $log.info('Opening streamdataio connection with the url: ' + appCtrl.url);

      // create the Streamdata source
      subscriber = streamdataio.subscribeToUrl(appCtrl.url, appCtrl.subscriberKey);
      //TODO Should be remove when proxy v2 is in production
      subscriber.proxy = 'http://haproxy-integ.streamdata.io';

      subscriber
        // add a callback when the connection is opened
        .onOpen(() => {
          $log.info('Connection is opened');
          appCtrl.datas = [];
          appCtrl.isConnected = true;
        })
        // add a callback when data is sent by streamdata.io
        .onData((datas) => {
          $log.info('Received datas:' + JSON.stringify(datas));
          $scope.$apply(() => {
            appCtrl.datas = datas;
          });
        })
        // add a callback when a patch is sent by streamdata.io
        .onPatch((patch) => {
          $scope.$apply(() => {
            if (!appCtrl.isPatching) {
              $log.info('Received patch:' + JSON.stringify(patch));
              appCtrl.isPatching = true;
              // apply the json-patch to the array of values
              jsonpatch.applyPatch(appCtrl.datas, patch);
              appCtrl.isPatching = false;
            }
          });
        })
        // add a callback when an error occured
        .onError((error) => {
          $scope.$apply(() => {
            $log.error('Received an error: ' + error.message);
            appCtrl.disconnect();
            appCtrl.errorMsg = error.message;
            $timeout(function () {
              appCtrl.errorMsg = null;
            }, 3000);
          });
        });

      // open the streamdata.io connection
      subscriber.open();
    };

    appCtrl.disconnect = () => {
      $log.info('Closing the connection of streamdataio');

      subscriber && subscriber.close();
      appCtrl.isConnected = false;
      appCtrl.isPatching = false;
    };

  }

  angular
    .module('app', ['ngSanitize', 'ngMaterial'])
    .config(function ($mdThemingProvider) {
      $mdThemingProvider.theme('default')
        .primaryPalette('deep-purple')
        .accentPalette('amber')
        .warnPalette('red')
        .backgroundPalette('grey');
    })
    .controller('AppController', ['$scope', '$log', '$timeout', AppController])
    .directive('popup', function () {
      return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
          ngModel: '=',
          options: '=popup'
        },
        link: function (scope, element) {
          scope.$watch('ngModel', function (val) {
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
