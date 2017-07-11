angular.module('aquaponics-app').component('login', {
    templateUrl: '/templates/login.template.html',
    controller: ['$scope', '$rootScope', '$http', '$location', function LoginController ($scope, $rootScope, $http, $location) {
        var self = this;
        
        $scope.username = '';
        $scope.password = '';

        $scope.login = function () {
            $http.post('/login', {
                username: $scope.username,
                credentials: CryptoJS.SHA256($scope.username + ":" + CryptoJS.MD5($scope.password).toString(CryptoJS.enc.Hex)).toString(CryptoJS.enc.Hex)
            }).then(function loginSuccess (response) {
                if (response.status === 200) {
                    $rootScope.id = response.data.id;
                    $rootScope.token = response.data.token;
                    $rootScope.isAdmin = response.data.isAdmin;
                    console.log($rootScope);
		    $rootScope.isAdmin = response.data.isAdmin;
                    $location.url('/');
                } else {
                    alert('Login failed');
                    $scope.username = '';
                    $scope.password = '';
                }
            }, function loginError(response) {
                alert('Login failed');
                $scope.username = '';
                $scope.password = '';
            });
        }
    }]
});
