var sock = new SockJS('http://congress.hedo:9999/chat');
var token = Math.random().toString(36).substr(2);


$(window).scroll(function(){
    $('.timescale').css({
        'left': $(this).scrollLeft()
         //Why this 15, because in the CSS, we have set left 15, so as we scroll, we would want this to remain at 15px left
    });
});

angular.module('hedodash', ['LocalStorageModule', 'ui.bootstrap'])
    .config(function (localStorageServiceProvider) {
      localStorageServiceProvider
        .setPrefix('hedo')
        .setStorageType('sessionStorage')
    })
    .controller('ScheduleController', function($scope, $http, $uibModal) {
        $http({
          method: 'GET',
          url: globalConfig.scheduleUrl
        }).then(function (response) {
            $scope.schedule = response.data.schedule.conference;

            $scope.openSearch = function (ev) {
                var modalInstance = $uibModal.open({
                  templateUrl: '/templates/search.html',
                  controller: function ($scope, events) {
                        $scope.events = events;
                        $scope.filteredEvents = events;
                        $scope.ok = function () {
                            modalInstance.close();
                        };
                      $scope.detailModal = function (ev) {
                            var modalInstance = $uibModal.open({
                              templateUrl: '/templates/detail_modal.html',
                              controller: function ($scope, event) {
                                  $scope.event = event;
                                  $scope.ok = function () {
                                      modalInstance.close();
                                  }
                              },
                              resolve: {
                                event: function () {
                                  return ev;
                                }
                              }
                            });
                        };
                      
                        $scope.$watch('query', function (newVal) {
                            $scope.filteredEvents = _.filter($scope.events, function(event) {
                                return event.title.toLowerCase().indexOf(newVal.toLowerCase()) > -1 ||
                                    event.weekday.toLowerCase().indexOf(newVal.toLowerCase()) > -1 ||
                                    event.room.toLowerCase().indexOf(newVal.toLowerCase()) > -1;
                            });
                        });

                  },
                  resolve: {
                    events: function () {
                        var events = [];
                        _.each($scope.schedule.days, function (day) {
                            _.each(day.rooms, function (room) {
                                _.each(room, function (ev) {
                                    var weekday = new Array(7);
                                    weekday[0]=  "Sunday";
                                    weekday[1] = "Monday";
                                    weekday[2] = "Tuesday";
                                    weekday[3] = "Wednesday";
                                    weekday[4] = "Thursday";
                                    weekday[5] = "Friday";
                                    weekday[6] = "Saturday";    
                                    ev.weekday = weekday[new Date(ev.date).getDay()];
                                    events.push(ev);
                                })
                            });
                        });
                        return events;
                    }
                  }
                });
            };
            $scope.selectDay = function (day) {
                $scope.selectedDay = null;
                $scope.selectedDay = day;
            };
            var today = new Date();
            var thisDay = _.find($scope.schedule.days, function(day) {
                if (day.date == '' + today.getFullYear() + '-0' + (today.getMonth() + 1) + '-' + today.getDate()) {
                    return true;
                }
            });
            if (!thisDay) {
                thisDay = $scope.schedule.days[0];
            }
            $scope.selectDay(thisDay);
        }, function (response) {
            alert('Couldn\'t load schedule data');
        });


    })
    .directive('scheduleDay', function() {
        return {
            templateUrl: '/templates/schedule_day.html',
            scope: {
                'day': '='
            },
            controller: function ($scope, $timeout, $uibModal) {
                $scope.$watch('day', function(newVal) {
                    if (!newVal) {
                        return
                    }
                    var minHour = null;
                    var maxHour = 6;
                    $scope.events = [];
                    $scope.hours = [];
                    $scope.detailModal = function (ev) {
                        var modalInstance = $uibModal.open({
                          templateUrl: '/templates/detail_modal.html',
                          controller: function ($scope, event) {
                              $scope.event = event;
                              $scope.ok = function () {
                                  modalInstance.close();
                              }
                          },
                          resolve: {
                            event: function () {
                              return ev;
                            }
                          }
                        });
                    };
                    _.each($scope.day.rooms, function (room) {
                        _.each(room, function (ev) {
                            if ((minHour == null || minHour > parseInt(ev.start.split(':')[0])) && parseInt(ev.start.split(':')[0]) > 6) {
                                minHour = parseInt(ev.start.split(':')[0]);
                            }
                            $scope.events.push(ev);
                        })
                    });
                    if (minHour == null) {
                        minHour = 10;
                    }
                    var hour = minHour;
                    while(true) {
                        var pref;
                        if (hour < 10) {
                            pref = '0';
                        } else {
                            pref = '';
                        }
                        $scope.hours.push(pref + hour);
                        if (hour == 23) {
                            hour = 0;
                        } else {
                            hour++;
                        }
                        if (hour == minHour || hour == maxHour) {
                            break;
                        }
                    }
                    console.log($scope.hours);
                    $('.events').addClass('loading');
                    // dom sensitive
                    $timeout(function() {
                        //positions
                        _.each($scope.events, function (ev) {
                            var slot_id = '#slot-' + ev.start.split(':')[0] + '-' + ev.start.split(':')[1];
                            ev.link = globalConfig.scheduleUrl + 'events/' + ev.id;
                            ev.top = $(slot_id).position().top;
                            ev.height = ev.duration.split(':')[0] * 4 * 50 + (ev.duration.split(':')[1] / 15) * 50;
                            ev.left = 50;
                        });

                        // collisions
                        $timeout(function () {
                            $('.event')
                                .each(function() {
                                    var thisDiv = $(this);
                                    while(true) {
                                        if(eventCollides(thisDiv)) {
                                            thisDiv.css({left: 201 + thisDiv.position().left });
                                        } else {
                                            break;
                                        }
                                    }
                                });
                            });
                            $timeout(function() {
                                $('.schedule-content').css({width: $(document).width()});
                                $('.events').removeClass('loading');
                            });

                    });

                    function eventCollides (div) {
                        var collides = false;
                        $('.event').each(function() {
                            if (collision(div, $(this)) && div.attr('id') != $(this).attr('id')) {
                                collides = true;
                                return false;
                            }
                        });
                        return collides;
                    }
                });

            }
        };
    })
    .controller('ChatController', function ($scope, $timeout, localStorageService) {
        $scope.messages = [];
        sock.onopen = function () {
            $scope.$watch('username', function(newVal) {
                localStorageService.set('chatname', $scope.username);
            });
            $scope.sendMessage = function (msg) {
                if (msg && msg != '') {
                    sock.send($scope.username + ":" + msg);
                    $scope.messageText = '';
                }
            };

            sock.onmessage = function (e) {
                if (e.data.startsWith(token)) {
                    if (e.data.split(":")[1] == 'history') {
                        _.each(e.data.split(":").slice(2).join(":").split(","), function (msg) {
                            if (msg != ''){
                                $scope.messages.push(msg);
                            }
                        });
                    } else if (e.data.split(":")[1] == 'user') {
                        if (localStorageService.get('chatname') != null && localStorageService.get('chatname') != '')
                            $scope.username = localStorageService.get('chatname');
                        else {
                            $scope.username = e.data.split(":")[2];
                        }
                    }
                } else {
                    $scope.messages.push(e.data);
                }
                $timeout(function() {
                    $('.message-box').scrollTop($('.message-box')[0].scrollHeight);
                });

                $scope.$apply();
            };
            $('.message-input').keypress(function(e){
                if(e.which==13)
                    $('#send-button').click();
            });
            sock.send('init:' + token);
        };
    })
    .controller('ModalController',  function ($scope, event) {
        $scope.event = event;
        /*
        $scope.ok = function () {
            $uibModalInstance.close();
        }*/
    });

function collision($div1, $div2) {
    var x1 = $div1.offset().left;
    var y1 = $div1.offset().top;
    var h1 = $div1.outerHeight(true);
    var w1 = $div1.outerWidth(true);
    var b1 = y1 + h1;
    var r1 = x1 + w1;
    var x2 = $div2.offset().left;
    var y2 = $div2.offset().top;
    var h2 = $div2.outerHeight(true);
    var w2 = $div2.outerWidth(true);
    var b2 = y2 + h2;
    var r2 = x2 + w2;

    if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
    return true;
}