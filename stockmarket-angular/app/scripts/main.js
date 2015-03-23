/* jshint devel:true */
(function() {

  function AppController($scope, $log, $timeout) {
    var vm = this;
    var streamdata;

    vm.init  = function() {
      vm.url = 'http://motwindemo-stockmarket.rhcloud.com/app/stockmarket/prices';
      vm.headers = '';
      vm.isConnected = false;
      vm.errorMsg = null;
    };

    vm.connect = function() {
      $log.info('Opening streamdataio connection with the url: ' + vm.url);

      // extract headers
      var headers = [];

      if (angular.isDefined(vm.headers) && vm.headers.length > 0) {
        headers = [vm.headers];
      }

      // create the Streamdata source
      streamdata = streamdataio.createEventSource(vm.url, headers);

      streamdata.streamdataConfig.PROTOCOL = 'https://';
      streamdata.streamdataConfig.HOST = 'proxy.streamdata.io';
      streamdata.streamdataConfig.PORT = '';

      // add a callback when the connection is opened
      streamdata.onOpen(function() {
        $log.info('Connection is opened');
        vm.isConnected = true;
      });

      // add a callback when data is sent by streamdata.io
      streamdata.onData(function(data) {
        $log.info('Received data: ' + JSON.stringify(data));
        $scope.datas = data;
        $scope.$digest();
      });

      // add a callback when a patch is sent by streamdata.io
      streamdata.onPatch(function(patch) {
        $log.info('Received path:' + JSON.stringify(patch));

        // apply the json-patch to the array of values
        jsonpatch.apply($scope.datas, patch);
        $scope.$digest();
      });

      // add a callback when an error occured
      streamdata.onError(function(error) {
        $log.error('Received an error: ' + error.message);

        vm.disconnect();

        vm.errorMsg = error.message;
        $scope.$digest();

        $timeout(function() {
          vm.errorMsg = null;
        }, 6000);

      });

      // open the streamdata.io connection
      streamdata.open();
    };

    vm.disconnect = function() {
      $log.info('Closing the connection of streamdataio');

      streamdata.close();
      vm.isConnected = false;
    }

    vm.init();

  };

  function ItemController($scope, $timeout) {
    $scope.$watch('cellValue', function() {
        console.log($scope);
        $scope.$parent.isActive = true;

        $timeout(function() {
          $scope.$parent.isActive = false;
        }, 2000);
    });
  };

  angular
    .module('app', [])
    .controller('AppController', ['$scope', '$log', '$timeout', AppController])
    .controller('ItemController', ['$scope', '$timeout', ItemController])
})();
