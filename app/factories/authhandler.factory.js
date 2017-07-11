angular.module('aquaponics-app').factory('authHandler', ['$location', '$rootScope', function authHandler ($location, $rootScope) {
    return {
        request: function (config) {
            var token = $rootScope.token;
            var username = $rootScope.id;
            if (token && username) {
                var url = config.url;
                url = url.replace(/\:\d+/, '').replace(/^http\:\/\/(localhost|\d+\.\d+\.\d+\.\d+)\//, '/');
                console.log("URL: " + config.url);
                console.log("RESOURCE: " + url);
                var qs = '';
                var i = 0;
        
                if (config.data) {
                    for (var key in config.data) {
                        if (config.data.hasOwnProperty(key) && !/\$\$hashKey/.test(key)) {
                            if (!i) {
                                qs += '?';
                            }

                            qs += encodeURIComponent(key) + '=' + encodeURIComponent(config.data[key]) + '&';
                            i++;
                        }
                    }
                }

                qs = qs.replace(/\&$/, '');

                console.log(url + qs);
                config.headers.id = username;
                config.headers.hash = CryptoJS.HmacSHA256(url + qs, token);
            
                // add IP to route calls to secondary servers if exists
                if ($rootScope.ip) {
	                console.log('IP:' + $rootScope.ip);
                    config.headers.ip = $rootScope.ip;
                }
            }
            
            return config;
        },
        response: function (config) {
            return config;
        },
        responseError: function (config) {
            if (config.status === 401) {
                if (!/\/login$/.test($location.url())) {
                    $location.url('/login');
                }
            }

            return config;
        }
    };
}]);
