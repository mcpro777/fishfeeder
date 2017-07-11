angular.module('aquaponics-app').component('scheduling', {
    templateUrl: '/templates/scheduling.template.html',
    bindings: { slideid: '=' },
    controller: ['$scope', '$rootScope', '$http', function SchedulingController ($scope, $rootScope, $http) {
        var self = this;
        $scope.schedules = [];
        $scope.scheduleBackups = [];
        $scope.newSchedule = null;

        $rootScope.$watch('ip', function () {
            //console.log('active slide changed - reloading schedules');
            //loadSchedules();
        });

	$rootScope.$on('slideChanged', function (event, data) {
	    if (self.slideid == data.slide) {
		loadSchedules();
            }
	});

        function loadSchedules () {
            $http.get('/schedule').then(function getScheduleSuccess (response) {
		if (!response.data.schedules) return;
                $scope.schedules = response.data.schedules;
                $scope.setScheduleBackups();
            });
        }

        $scope.setScheduleBackups = function setScheduleBackups (id, del) {
            angular.copy($scope.schedules, $scope.scheduleBackups);

            if (!id) {
                for (var i = 0; i < $scope.schedules.length; i++) {
                    $scope.pristine[$scope.schedules[i]._id] = true;
                }
            } else if (del) {
                delete $scope.pristine[id];
            } else {
                $scope.pristine[id] = true;
            }

            $scope.allPristine();
        };

        $scope.createNewSchedule = function createNewSchedule () {
            console.log(self.active);
            $scope.newSchedule = {
                time: '',
                units: 1
            };
        };

        $scope.updateSchedule = function updateSchedule (schedule) {
            $http.put('/schedule/' + schedule._id, schedule).then(function updateScheduleSuccess (response) {
                $scope.setScheduleBackups(schedule._id);
            }, function updateScheduleError (response) {
                console.log('Update error');
                console.log(response);
            });
        };

        $scope.deleteSchedule = function deleteSchedule (schedule) {
            $http.delete('/schedule/' + schedule._id).then(function deleteScheduleSuccess (response) {
                for (var i = 0; i < $scope.schedules.length; i++) {
                    if ($scope.schedules[i]._id === schedule._id) {
                        $scope.schedules.splice(i, 1);
                        break;
                    }
                }
                $scope.setScheduleBackups(schedule._id, true);
            }, function deleteScheduleError (response) {
                console.log('delete error');
                console.log(response);
            });
        };

        $scope.saveNewSchedule = function saveNewSchedule () {
            $http.post('/schedule', $scope.newSchedule).then(function saveNewScheduleSuccess (response) {
                if (response.status === 200) {
                    $scope.schedules.push(response.data);
                    $scope.cancelNewSchedule();
                    $scope.setScheduleBackups();
                } else {
                    console.log('error saving');
                    console.log(response);
                }
            }, function saveNewScheduleError (response) {
                console.log('error saving');
                console.log(response);
            });
        };

        $scope.cancelNewSchedule = function cancelNewSchedule () {
            $scope.newSchedule = null;
        };

        $scope.pristineAll = true;
        $scope.allPristine = function allPristine () {
            var pristine = true;

            for (var key in $scope.pristine) {
                if ($scope.pristine.hasOwnProperty(key)) {
                    if (!$scope.pristine[key]) {
                        pristine = false;
                    }
                }
            }
            $scope.pristineAll = pristine;
        };
        
        $scope.pristine = {};
        $scope.isPristine = function isPristine (id) {
            var pristine = true;

            for (var i = 0; i < $scope.schedules.length; i++) {
                if ($scope.schedules[i]._id === id) {
                    for (var j = 0; j < $scope.scheduleBackups.length; j++) {
                        if ($scope.scheduleBackups[j]._id === $scope.schedules[i]._id) {
                            if ($scope.scheduleBackups[j].time !== $scope.schedules[i].time) {
                                pristine = false;
                            }
                            
                            if ($scope.scheduleBackups[j].units !== $scope.schedules[i].units) {
                                pristine = false;
                            }
                        }
                    }
                    break;
                }
            }

            console.log('schedule ' + id + ' is ' + (pristine ? 'not ' : '') + 'pristine.');
            $scope.pristine[id] = pristine;
        };
    }]
});
