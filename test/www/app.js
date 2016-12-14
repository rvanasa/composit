/* global angular */
angular.module('app', [])

.factory('test', function($http)
{
	return 5;
})

.factory('f223344', function($http, $inject)
{
	return 5;
})