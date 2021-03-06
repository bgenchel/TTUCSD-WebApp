'use strict';

// Declare app level module which depends on filters, and services

angular.module('garnett', [
  'ngRoute',
  'myApp.controllers',
  'timeline.controller',
  'myApp.filters',
  'myApp.services',
  'myApp.directives'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/timeline', {
      templateUrl: 'partials/timeline',
      controller: 'TimelineCtrl'
    }).
    when('/view2', {
      templateUrl: 'partials/partial2',
      controller: 'MyCtrl2'
    }).
    when('/new', {
      templateUrl: 'partials/newEvent',
      controller: 'EventsCtrl'
    }).
    when('/events/:eventId', {
      templateUrl: 'partials/eventPage',
      controller: 'EventPageCtrl'
    }).
    otherwise({
      redirectTo: '/timeline'
    });

    $locationProvider.html5Mode(true);
});
