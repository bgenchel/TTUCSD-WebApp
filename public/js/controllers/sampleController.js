'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', function ($scope, $http, $window) {
    $scope.logout = function (){
      console.log("enter logout from front end");
      $window.location.href = '/logout';
    };

    $scope.sayHello = function() {
      $scope.greeting = "Hello World";
    };
  }).
  controller('TimelineCtrl', function ($scope, $window) {
    // write Ctrl here
    console.log("in timeline");
  }).
  controller('MyCtrl2', function ($scope) {
    // write Ctrl here
    console.log("enter controller 2");
  }).
  controller('EventsCtrl', function ($scope) {
    // write Ctrl here
    console.log("enter EventsCtrl");
  }).
  controller('EventPageCtrl', ['$scope', '$routeParams', 'EventData', function ($scope, $routeParams, EventData) {
    EventData.get($routeParams.eventId, function(data) {
      $scope.eventData = data.eventData[0];
      $scope.memberData = data.memberData[0];
    });
    // write Ctrl here
    console.log("enter EventPageCtrl");
  }]);
