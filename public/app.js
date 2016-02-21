var nodeProxy = angular.module('nodeProxy', ['ngRoute'])

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

  $scope.addSite = function(site) {
    $http.post('/blacklist', {site})
    .success(function(data) {
      $scope.blacklist = data;
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
