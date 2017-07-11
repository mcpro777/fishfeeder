angular.module('aquaponics-app').run(['$rootScope', '$http', '$location', function ($rootScope, $http, $location) {
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        $http.head('/ping').then(function pingSuccess (response) {}, function pingError (response) {
            if (!/\/login$/.test(next)) {
                $location.url('/login');
            }
        });
    });
}]);
