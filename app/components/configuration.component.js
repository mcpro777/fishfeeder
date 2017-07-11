angular.module('aquaponics-app').component('configuration', {
    templateUrl: '/templates/configuration.template.html',
    controller: ['$scope', '$location', '$http', function ConfigurationController ($scope, $location, $http) {
        var self = this;
	
        $scope.configurations = [
            { name: "Pi 1", ipAddress: "0.0.0.0" },
            { name: "Pi 2", ipAddress: "0.0.0.0"}
        ];

        $scope.saveIpAddress = function(config){
            var body = {
                name: config.name,
                ipAddress: config.ipAddress
            };

            $http.put('/config', body).then(function (response) {
                config.unlockedForEdit = false;
            });
        }

        $scope.unlockIpAddress = function (config){
            config.unlockedForEdit = true;
        };

        $scope.home = function () {		
            $location.url('/');
        };

        self.$onInit = function () {
            $http.get('/config').then(function (response) {
                if (response.status === 200 && response.data) {
                    for (var i = 0; i < response.data.length; i++) {
                        for (var j = 0; j < $scope.configurations.length; j++) {
                            if (response.data[i]._id === $scope.configurations[j].name) {
                                $scope.configurations[j].ipAddress = response.data[i].ipAddress;
                            }
                        }
                    }
                }
            });
        };
    }]
});
