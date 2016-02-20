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

.controller('mainCtrl', ['$scope', '$http', function($scope, $http) {

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
