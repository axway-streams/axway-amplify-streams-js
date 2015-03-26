/* jshint devel:true */
(function() {

  function AppController($scope, $log, $timeout) {
    var vm = this;
    var streamdata;
    vm.tab = 1;
    vm.isPatching = false;
    vm.limitNbPatch = 100;
    vm.headers = [];

    vm.init  = function() {
      vm.url = 'http://motwindemo-stockmarket.rhcloud.com/app/stockmarket/prices';
      vm.addHeader();
      vm.isConnected = false;
      vm.errorMsg = null;
    };

    vm.addHeader = function() {
        vm.headers.push({ name: "", value: ""});
    }

    vm.removeHeader = function(index) {
        vm.headers.splice(index, 1);
        vm.headersToArray();
    }

    vm.headersToArray = function() {
        var out = [];
        vm.headers.forEach(function(header) {
            out[header.name] = header.value;
        });
        return out;
    }

    vm.connect = function() {
      $log.info('Opening streamdataio connection with the url: ' + vm.url);
      vm.setBusyCursor(true);

      // extract headers
      var headers = [];

      if (vm.headers.length > 0 && vm.headers[0].name != "" && vm.headers[0].value != "") {
        headers = vm.headersToArray(vm.headers);
      }

      // create the Streamdata source
      streamdata = streamdataio.createEventSource(vm.url, headers);

      streamdata.streamdataConfig.PROTOCOL = 'https://';
      streamdata.streamdataConfig.HOST = 'proxy.streamdata.io';
      streamdata.streamdataConfig.PORT = '';

      // add a callback when the connection is opened
      streamdata.onOpen(function() {
        $log.info('Connection is opened');
        vm.setBusyCursor(false);
        vm.initDatas();
        $scope.$digest();
        vm.isConnected = true;
      });

      // add a callback when data is sent by streamdata.io
      streamdata.onData(function(data) {
        //$log.info('Received data: ' + JSON.stringify(data));
        $scope.datasStringify = diffUsingJS("", JSON.stringify(data, null, 2));
        $scope.patchStringify = "";
        $scope.datasArray = castToArray(data);
        $scope.datas = data;
        $scope.$digest();
      });

      // add a callback when a patch is sent by streamdata.io
      streamdata.onPatch(function(patch) {
        if(patch.length > vm.limitNbPatch) {
            patch.splice(vm.limitNbPatch,patch.length-vm.limitNbPatch);
            vm.displayError("Too many operations in patch, only " + vm.limitNbPatch + " firsts operations are applyed");
        }
        if(!vm.isPatching) {
            vm.isPatching = true;
            $scope.$digest();
            $timeout(function() {
                vm.isPatching = true;
                //$log.info('Received path:' + JSON.stringify(patch));

                var oldDatas = JSON.stringify($scope.datas, null, 2);

                // apply the json-patch to the array of values
                jsonpatch.apply($scope.datas, patch);

                // render Array
                $scope.datasArray = castToArray($scope.datas);
                // render Patched JSON document
                $scope.datasStringify = diffUsingJS(oldDatas, JSON.stringify($scope.datas, null, 2));
                // render JSON Patch Operations
                $scope.patchStringify += formatPatch(patch);


                $scope.$digest();
                // Scroll JSON Patch operations container to bottom
                $("#patchCtn").scrollTop($("#patchCtn")[0].scrollHeight);
                vm.isPatching = false;
                $scope.$digest();
            });
        }
      });

      // add a callback when an error occured
      streamdata.onError(function(error) {
        $log.error('Received an error: ' + error.message);
        vm.setBusyCursor(false);

        vm.disconnect();

        vm.displayError(error.message);

      });

      // open the streamdata.io connection
      streamdata.open();
    };

    vm.disconnect = function() {
      $log.info('Closing the connection of streamdataio');

      streamdata.close();
      vm.isConnected = false;
      vm.isPatching = false;
    };

    vm.setBusyCursor = function(status) {
        if(status) {
            $("body").css("cursor", "progress");
        } else {
            $("body").css("cursor", "default");
        }
    };

    vm.initDatas = function() {
        $scope.datasStringify = "<p/>";
        $scope.patchStringify = "<p/>";
        $scope.datasArray = [];
    };

    vm.displayError = function(errMsg) {
        vm.errorMsg = errMsg;
        $scope.$digest();

        $timeout(function() {
          vm.errorMsg = null;
        }, 3000);
    }

    vm.init();

  };

  function compareDatas(str_input, str_output)
  {
    // skip html tags
    str_input = str_input.replace(/<(?:.|\n)*?>/gm, '');
    str_output = str_output.replace(/<(?:.|\n)*?>/gm, '');
    console.log(str_input);
  	return "<p>"+diffString(str_input,str_output)+"</p>";
  }

  function diffUsingJS(base, newTxt, viewType) {
    viewType = viewType || 1;
	var base = difflib.stringAsLines(base),
	    newTxt = difflib.stringAsLines(newTxt),
	    sm = new difflib.SequenceMatcher(base, newTxt),
		opcodes = sm.get_opcodes();

	return diffview.buildView({
		baseTextLines: base,
		newTextLines: newTxt,
		opcodes: opcodes,
		baseTextName: "JSON document",
		newTextName: "JSON patched document",
		contextSize: null,
		viewType: viewType
	});
  }

  function formatPatch(patch) {
    var patchStr = syntaxHighlight(patch);
    patchStr = patchStr.replace(/{/g, '<br/>  {').replace(/}]/g, '}<br/>]');
    return "<p>"+patchStr+"</p>";
  }

  function syntaxHighlight(json) {
       json = JSON.stringify(json);
       json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
       return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
           var cls = 'json-number';
           if (/^"/.test(match)) {
               if (/:$/.test(match)) {
                   cls = 'json-key';
               } else {
                   cls = 'json-string';
               }
           } else if (/true|false/.test(match)) {
               cls = 'json-boolean';
           } else if (/null/.test(match)) {
               cls = 'json-null';
           }
           return '<span class="' + cls + '">' + match + '</span>';
       });
  }

  function castToArray(obj) {
    if(Object.prototype.toString.call(obj) === '[object Array]' ) {
        return obj;
    } else {
        return [obj];
    }
  }

  function ItemController($scope, $timeout) {
    $scope.$watch('cellValue', function() {
        $scope.$parent.isActive = true;

        $timeout(function() {
          $scope.$parent.isActive = false;
        }, 2000);
    });
  };

  angular
    .module('app', ['ngSanitize'])
    .controller('AppController', ['$scope', '$log', '$timeout', AppController])
    .controller('ItemController', ['$scope', '$timeout', ItemController])
    .controller('TabController', function () {
        this.tab = 1;

        this.setTab = function (tabId) {
            this.tab = tabId;
        };

        this.isSet = function (tabId) {
            return this.tab === tabId;
        };
    })
    .directive('bindHtmlUnsafe', function( $parse, $compile ) {
        return function( $scope, $element, $attrs ) {
            var compile = function( newHTML ) {
                newHTML = $compile(newHTML)($scope);
                $element.html('').append(newHTML);
            };

            var htmlName = $attrs.bindHtmlUnsafe;

            $scope.$watch(htmlName, function( newHTML ) {
                if(!newHTML) return;
                compile(newHTML);
            });

        };
    });
})();
