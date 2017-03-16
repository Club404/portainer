angular
  .module('portainer')
  .directive('dropTarget', function () {
    function addEvent(to, type, fn) {
      if ('addEventListener' in document) {
        to.addEventListener(type, fn, false);
      } else if ('attachEvent' in document) {
        to.attachEvent('on' + type, fn);
      } else {
        to['on' + type] = fn;
      }
    };
    return {
      replace: true,
      restrict: 'AEMC',
      scope: {
        action: '&dropAction',
      },
      controller: ['$scope', function ($scope) {
        $scope.over = function () {
        };
        $scope.enter = function () {
        };
        $scope.leave = function () {
        };
        $scope.drop = function (data) {
          // console.debug(' - Drop', data);

          if ($scope.action) {
            $scope.action({
              data: data,
            });
          }
        }
      }],
      link: function ($scope, element) {
        var className = 'over';
        addEvent(element[0], 'dragover', function (e) {
          if (e.preventDefault) e.preventDefault(); // allows us to drop
          e.dataTransfer.dropEffect = 'copy';
          element.toggleClass(className, true);
          $scope.over();
          return false;
        });
        addEvent(element[0], 'dragenter', function (e) {
          element.toggleClass(className, true); // to get IE to work
          $scope.enter();
          return false;
        });
        addEvent(element[0], 'dragleave', function () {
          element.toggleClass(className, false);
          $scope.leave();
        });
        addEvent(element[0], 'drop', function (e) {
          if (e.stopPropagation) e.stopPropagation(); // stops the browser from redirecting...why???
          element.toggleClass(className, false);
          var items = document.getElementsByClassName(className);
          if (items && items.length) {
            for (var i = 0; i < items.length; i++) {
              angular.element(items[i]).toggleClass(className, false);
            }
          }
          var data = e.dataTransfer.getData('Text');
          $scope.drop(JSON.parse(data));
          return false;
        });
      },
    };
  })
  .directive('dragItem', function () {
    function addEvent(to, type, fn) {
      if ('addEventListener' in document) {
        to.addEventListener(type, fn, false);
      } else if ('attachEvent' in document) {
        to.attachEvent('on' + type, fn);
      } else {
        to['on' + type] = fn;
      }
    };
    return {
      replace: true,
      restrict: 'AEMC',
      scope: {
        data: '=dragData',
      },
      controller: ['$scope', function ($scope) {
        $scope.drag = function (data) {
          // console.debug(' - Drag:', data);
        }
      }],
      link: function ($scope, element) {
        element.attr('draggable', 'true');
        addEvent(element[0], 'dragstart', function (e) {
          var data = $scope.data;
          e.dataTransfer.effectAllowed = 'copy'; // only dropEffect='copy' will be dropable
          e.dataTransfer.setData('Text', JSON.stringify(data)); // required otherwise doesn't work
          $scope.drag(data);
        });
      },
    };
  });
