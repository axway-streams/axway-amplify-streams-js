/* jshint devel:true */
(function () {

    function AppController($scope, $log, $timeout) {
        var vm = this;
        var streamdata;
        vm.tab = 1;
        vm.isPatching = false;
        vm.limitNbPatch = 100;
        vm.headers = [];

        this.popupPk = {
            content: 'An application token is required for authentication. <a href="https://portal.streamdata.io/#/register" target="_blank">Sign Up</a> to get yours.',
            options: {
                title: null,
                placement: 'left',
                html: true,
                delay: {show: 0, hide: 1500}
            }
        };
        this.popupHeaders = {
            content: 'Add any custom HTTP Header (optional)',
            options: {
                title: null,
                placement: 'right',
                html: false,
                delay: {show: 0, hide: 0}
            }
        };
        this.popupSignature = {
            content: 'Sign your request with your application private key.',
            options: {
                title: null,
                placement: 'right',
                html: false,
                delay: {show: 0, hide: 0}
            }
        };
        vm.init = function () {
            vm.url = 'http://demo-streamdataio.rhcloud.com/stockmarket/prices';
            vm.isConnected = false;
            vm.errorMsg = null;
        };

        vm.addHeader = function () {
            vm.headers.push({name: "", value: ""});
        }

        vm.removeHeader = function (index) {
            vm.headers.splice(index, 1);
            vm.headersToArray();
        }

        vm.headersToArray = function () {
            var out = [];
            vm.headers.forEach(function (header) {
                out.push(header.name + ":" + header.value);
            });
            return out;
        }

        vm.connect = function () {
            $log.info('Opening streamdataio connection with the url: ' + vm.url);
            vm.setBusyCursor(true);

            // extract headers
            var headers = [];

            if (vm.headers.length > 0 && vm.headers[0].name != "" && vm.headers[0].value != "") {
                headers = vm.headersToArray(vm.headers);
            }

            // you can store your key pair in a json file instead, more details in documentation
            // setup signatureStrategy
            // setup signatureStrategy
            var signatureStrategy;
            if (typeof AuthStrategy === 'undefined') {
                signatureStrategy = null;
            } else {
                if (AuthStrategy != null) {
                    signatureStrategy = AuthStrategy.newSignatureStrategy(vm.token, vm.pk);
                } else {
                    signatureStrategy = null;
                }
            }

            // create the Streamdata source
            streamdata = streamdataio.createEventSource(vm.url, vm.token, headers, signatureStrategy);

            streamdata.streamdataConfig.PROTOCOL = 'https://';
            streamdata.streamdataConfig.HOST = 'streamdata.motwin.net';
            streamdata.streamdataConfig.PORT = '';

            // add a callback when the connection is opened
            streamdata.onOpen(function () {
                $log.info('Connection is opened');
                vm.setBusyCursor(false);
                vm.initDatas();
                $scope.$digest();
                vm.isConnected = true;
            });

            // add a callback when data is sent by streamdata.io
            streamdata.onData(function (data) {
                //$log.info('Received data: ' + JSON.stringify(data));
                $scope.datasStringify = diffUsingJS("", JSON.stringify(data, null, 2));
                $scope.patchStringify = "";
                if (Object.prototype.toString.call(data) === '[object Array]') {
                    $scope.datasArray = data;
                    vm.setTab(1);
                } else {
                    vm.setTab(2);
                }
                $scope.datas = data;
                $scope.$digest();
            });

            // add a callback when a patch is sent by streamdata.io
            streamdata.onPatch(function (patch) {
                if (patch.length > vm.limitNbPatch) {
                    patch.splice(vm.limitNbPatch, patch.length - vm.limitNbPatch);
                    vm.displayError("Too many operations in patch, only " + vm.limitNbPatch + " firsts operations are applied");
                }
                if (!vm.isPatching) {
                    vm.isPatching = true;
                    $scope.$digest();
                    $timeout(function () {
                        $log.info('Received path:' + JSON.stringify(patch));

                        var oldDatas = JSON.stringify($scope.datas, null, 2);

                        // apply the json-patch to the array of values
                        jsonpatch.apply($scope.datas, patch);

                        // render Array
                        if (Object.prototype.toString.call($scope.datas) === '[object Array]') {
                            $scope.datasArray = $scope.datas;
                        }
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
            streamdata.onError(function (error) {
                $log.error('Received an error: ' + error.message);
                vm.setBusyCursor(false);

                vm.disconnect();

                vm.displayError(error.message);

            });

            // open the streamdata.io connection
            streamdata.open();
        };

        vm.disconnect = function () {
            $log.info('Closing the connection of streamdataio');

            streamdata.close();
            vm.isConnected = false;
            vm.isPatching = false;
            $scope.datasArray = [];
        };

        vm.setBusyCursor = function (status) {
            if (status) {
                $("body").css("cursor", "progress");
            } else {
                $("body").css("cursor", "default");
            }
        };

        vm.initDatas = function () {
            $scope.datasStringify = "<p/>";
            $scope.patchStringify = "";
            $scope.datasArray = [];
        };

        vm.displayError = function (errMsg) {
            vm.errorMsg = errMsg;
            $scope.$digest();

            $timeout(function () {
                vm.errorMsg = null;
            }, 3000);
        }

        vm.tab = 1;

        vm.setTab = function (tabId) {
            vm.tab = tabId;
        };

        vm.isSet = function (tabId) {
            return vm.tab === tabId;
        };

        vm.init();

    };

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
        return "<p>" + patchStr + "</p>";
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

    function ItemController($scope, $timeout) {
        $scope.$watch('cellValue', function () {
            $scope.$parent.isActive = true;

            $timeout(function () {
                $scope.$parent.isActive = false;
            }, 2000);
        });
    };

    angular
        .module('app', ['ngSanitize'])
        .controller('AppController', ['$scope', '$log', '$timeout', AppController])
        .controller('ItemController', ['$scope', '$timeout', ItemController])
        .directive('bindHtmlUnsafe', function ($parse, $compile) {
            return function ($scope, $element, $attrs) {
                var compile = function (newHTML) {
                    newHTML = $compile(newHTML)($scope);
                    $element.html('').append(newHTML);
                };

                var htmlName = $attrs.bindHtmlUnsafe;

                $scope.$watch(htmlName, function (newHTML) {
                    if (!newHTML) return;
                    compile(newHTML);
                });

            };
        })
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

                    var options = scope.options || {};

                    var title = options.title || null;
                    var placement = options.placement || 'right';
                    var html = options.html || false;
                    var delay = options.delay ? angular.toJson(options.delay) : null;
                    var trigger = options.trigger || 'hover';

                    element.attr('title', title);
                    element.attr('data-placement', placement);
                    element.attr('data-html', html);
                    element.attr('data-delay', delay);
                    element.popover({trigger: trigger});
                }
            };
        });
})();
