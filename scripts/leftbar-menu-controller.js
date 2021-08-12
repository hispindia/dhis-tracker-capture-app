//Controller for column show/hide
var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('LeftBarMenuController',
        function($scope,
                $location) {
    $scope.showHome = function(){
        selection.load();
        $location.path('/').search();
    }; 
    
    $scope.showReportTypes = function(){
        $location.path('/report-types').search();
    };

    $scope.showIncomingRefarrals = function(){
        $location.path('/incoming-referrals').search();
    };
  
    $scope.showOutgoingRefarrals = function(){
        $location.path('/outgoing-referrals').search();
    };
});