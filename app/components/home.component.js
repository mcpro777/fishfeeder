angular.module('aquaponics-app').component('home', {
    templateUrl: '/templates/home.template.html',
    controller: ['$scope', '$rootScope', '$http', '$location', '$interval', '$sce', '$timeout', function HomeController ($scope, $rootScope, $http, $location, $interval, $sce, $timeout) {
        var self = this;
        var interval = null;

        $scope.configurations = [
            { name: "Pi 1", ipAddress: "0.0.0.0" },
            { name: "Pi 2", ipAddress: "0.0.0.0"}
        ];

        $scope.active = 0;
        $scope.carousel = {
            //interval: 2000,
            slides: [
                {
                    id: 0,
                    image: "http://dummyimage.com/600x400/db1bdb/1edb09&text=slide1",
        		    light: false,
                    feedingInProgress: false,
                    units: 1,
                    ipAddress: '',
                    maxFeedUnits: 0,
		    maxFeedUnitsUnlocked: false
                },
                {
                    id: 1,
                    image: "http://dummyimage.com/600x400/1c48d9/e00438&text=slide2",
		            light: false,
                    feedingInProgress: false,
                    units: 1,
                    ipAddress: '',
		    maxFeedUnits: 0,
		    maxFeedUnitsUnlocked: false
                },
                {
                    id: 2,
                    image: "http://dummyimage.com/600x400/e60000/04dede&text=slide3",
		            light: false,
                    feedingInProgress: false,
                    units: 1,
                    ipAddress: '',
		    maxFeedUnits: 0,
		    maxFeedUnitsUnlocked: false
                } 
            ]
        }
	
	$scope.isAdminUser = function(){
	    return $rootScope.isAdmin;
	}

        $scope.$watch('active', function () {
            getMaxFeedUnits($scope.carousel.slides[$scope.active]);
            getWaterTemp($scope.carousel.slides[$scope.active]);
            var ip = $scope.active ? getIP() : null;
            console.log('Slide ' + $scope.active + ' is active');
            console.log('Setting root scope ip: ' + ip);
            $rootScope.ip = ip;
	    $rootScope.$broadcast('slideChanged', {ip:ip, slide: $scope.active});
        });

        $scope.$watch('carousel.slides[1].active', function (active) {
            if (active) {
                var ip = getIP(1);
                console.log('Slide 1 is active');
                console.log('Setting ip: ' + ip);
                $rootScope.ip = ip;
            }
        });

        $scope.$watch('carousel.slides[2].active', function (active) {
            if (active) {
                var ip = getIP(2);
                console.log('Slide 2 is active');
                console.log('Setting ip: ' + ip);
                $rootScope.ip = ip;
            }
        });

        $scope.celsius = "---";
        $scope.fahrenheit = "---";
        $scope.displayCelsius = false;
        $scope.humidity = "---";
        $scope.watertemp = 'n/a';

        $scope.changeTempDisplay = function changeTempDisplay () {
            $scope.displayCelsius = !$scope.displayCelsius;
        };

        $scope.startFeeder = function startFeeder (slide) {
            slide.feedingInProgress = true;
            $http.post('/feeder/start', {units: slide.units}).then(function startFeederSuccess (response) {
                slide.feedingInProgress = false;
            }, function startFeederError () {
                slide.feedingInProgress = false;
            });
        };

        $scope.stopFeeder = function stopFeeder (slide) {
            $http.post('/feeder/stop').then(function stopFeederSuccess () {
                slide.feedingInProgress = false;
            });
        };

        $scope.toggleLight = function(slide){
	        if(slide.light){
                $http.post('/light/off').then(function lightOffSuccess (response) {
                    slide.light = false;
                });
	        }
            else{
                $http.post('/light/on').then(function lightOnSuccess (response) {
                    slide.light = true;
                }, function(){ console.info(response); });
            }
        };

	$scope.setMaxFeedUnits = function(slide, max){
	    $http.post('/feed/max', { max: max}).then(function (){
		    slide.maxFeedUnitsUnlocked = false;
	    });
	}
	
	function getMaxFeedUnits (slide){
            $http.get('/feed/max').then(function(response){
                //alert(response.data.max);
                slide.maxFeedUnits = response.data.max;
            });
	}

        function getWaterTemp(slide) {
		if (slide == null)  slide = $scope.carousel.slides[$scope.active];

                $http.get('/wt').then(function wtSuccess (response) {
		  if (response && response.data && response.data.temperature_fahrenheit)
			slide.watertemp = response.data.temperature_fahrenheit;
		    else
			slide.watertemp = 'n/a';
                })
		.catch(function () {
		    slide.watertemp = 'n/a';
		});
        }

	function initSchedule() {
	    var slideInfo = {ip:getIP($scope.carousel.slides[0]), slide: 0};
	    $rootScope.$broadcast('slideChanged', slideInfo);
	}

        self.$onInit = function init () {
            $http.get('/config').then(function (response) {
                if (response.status === 200 && response.data) {
                    for (var i = 0; i < response.data.length; i++) {
                        for (var j = 0; j < $scope.configurations.length; j++) {
                            if (response.data[i]._id === $scope.configurations[j].name) {
                                $scope.configurations[j].ipAddress = response.data[i].ipAddress;
                            }
                        }
                    }


                    readSensorsAndInit();
		    getMaxFeedUnits($scope.carousel.slides[$scope.active]);
                    
                    $timeout(initSchedule, 1000);

                    if (!interval) {
                        interval = $interval(readSensorsAndInit, 10000); // poll every 10 seconds for updates
                    }
                }
            });
        };

        $scope.$on('$locationChangeStart', function (event, next, current) {
            if (interval) {
                $interval.cancel(interval);
                interval = null;
            }
        });

        function getIP (slide) {
            var active = slide ? slide.id : $scope.active;

            if (active === 1) {
                for (var i = 0; i < $scope.configurations.length; i++) {
                    if ($scope.configurations[i].name === 'Pi 1') {
                        return $scope.configurations[i].ipAddress;
                    }
                }
            } else if (active === 2) {
                for (var j = 0; j < $scope.configurations.length; j++) {
                    if ($scope.configurations[j].name === 'Pi 2') {
                        return $scope.configurations[j].ipAddress;
                    }
                }
            }

            return window.location.hostname;
        }

        function readSensorsAndInit () {
            var slide0 = $scope.carousel.slides[0];
	    //var feedUrl = 'http://' + getIP(slide0) + '/static/camfeed.html?ip=pi:aquaponics@';		
	    var feedUrl = 'http://' + getIP(slide0) + '/static/camfeed.html?ip=';		
            getWaterTemp(null);

            (function (slide) {
		        //slide.feedUrl = $sce.trustAsResourceUrl(feedUrl + getIP(slide) + ':81');
			slide.feedUrl = $sce.trustAsResourceUrl(feedUrl + getIP(slide));
		        slide.feedLink = $sce.trustAsResourceUrl('http://pi:aquaponics@' + getIP(slide) + ':81/html/');
                $http.get('/th').then(function thSuccess (response) {
                    $scope.celsius = response.data.temperature_celsius;
                    $scope.fahrenheit = response.data.temperature_fahrenheit;
                    $scope.humidity = response.data.humidity;
                });
            })(slide0);

            (function (slide) {
		//slide.feedUrl = $sce.trustAsResourceUrl(feedUrl + getIP(slide) + ':81');
		slide.feedUrl = $sce.trustAsResourceUrl(feedUrl + getIP(slide));
		slide.feedLink = $sce.trustAsResourceUrl('http://pi:aquaponics@' + getIP(slide) + ':81/html/');			
            })($scope.carousel.slides[1]);
            
            (function (slide) {
		//slide.feedUrl = $sce.trustAsResourceUrl(feedUrl + getIP(slide) + ':81');
		slide.feedUrl = $sce.trustAsResourceUrl(feedUrl + getIP(slide));
		slide.feedLink = $sce.trustAsResourceUrl('http://pi:aquaponics@' + getIP(slide) + ':81/html/');
            })($scope.carousel.slides[2]);
        }
    }]
});
