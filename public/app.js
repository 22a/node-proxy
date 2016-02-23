var nodeProxy = angular.module('nodeProxy', ['ngRoute', 'uiSwitch'])

.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'control.html',
    controller: 'mainCtrl'
  })
  .otherwise({
    redirectTo: '/'
  });
  $locationProvider.html5Mode(true);
}])

.directive('showTail', function () {
  return function (scope, elem, attr) {
    scope.$watch(function () {
      return elem[0].value;
    },
    function (e) {
      elem[0].scrollTop = elem[0].scrollHeight;
    });
  }
})

.controller('mainCtrl', ['$scope', '$http', function($scope, $http) {

  $scope.messageLog = '';
  $scope.url = {};
  $scope.url.protocol = 'http://';

  $scope.caching = true;
  $scope.$watch("caching", function(newValue, oldValue) {
    if (newValue != oldValue) {
      $http.post('/toggleCache', {'value': newValue})
      .error(function(data){
      });
    }
  });

  $scope.blacklisting = true;
  $scope.$watch("blacklisting", function(newValue, oldValue) {
    if (newValue != oldValue) {
      $http.post('/toggleBlacklist', {'value': newValue})
      .error(function(data){
      });
    }
  });

  var proxySocket = new WebSocket("ws://localhost:8008");
  proxySocket.onmessage = function (event) {
    $scope.$apply(function(){
      $scope.messageLog = $scope.messageLog + '\n' + event.data;
    });
  };

  $http.get('/blacklist')
  .success(function(data) {
    $scope.blacklist = data;
  })
  .error(function(data) {
    $scope.blacklist = [];
    console.log('Error retreving blacklist');
  });

  $scope.addSite = function() {
    $http.post('/blacklist', {'site':$scope.url.protocol + $scope.url.domain})
    .success(function(data) {
      $scope.blacklist = data;
      $scope.url.domain = '';
    })
    .error(function(data) {
      console.log('Error adding site to blacklist');
    });
  };

  $scope.deleteSite = function(id) {
    $http.delete('/blacklist/' + id)
    .success(function(data) {
      $scope.blacklist = data;
    })
    .error(function(data) {
      console.log('Error removing site from blacklist');
    });
  };

}]);
