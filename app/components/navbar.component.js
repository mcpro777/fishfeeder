angular.module('aquaponics-app').component('navbar', {
    templateUrl: '/templates/navbar.template.html',
    controller: ['$scope', '$http', '$location', '$rootScope',  function HomeController ($scope, $http, $location, $rootScope) {
        var self = this;

        $scope.logout = function logout () {
            window.location.reload();
        };

	$scope.isAdminUser = function(){
	    return $rootScope.isAdmin;
	}

	$scope.configuration = function () {
	    $location.url('/configuration');
        };

	$scope.home = function(){ 
	    $location.url('/')
	};

	$scope.openNavMenu = function(){
	    $scope.navMenuOpen = !$scope.navMenuOpen;
	};

	$scope.activePage = {
	    isHome: function(){ return $location.url() == "/"; },
	    isConfiguration: function(){ return $location.url() == "/configuration"; }
	}
    }]
});
