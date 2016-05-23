$(window).scroll(function(){
    $('.timescale').css({
        'left': $(this).scrollLeft()
         //Why this 15, because in the CSS, we have set left 15, so as we scroll, we would want this to remain at 15px left
    });
});

angular.module('hedodash', [])
    .controller('ScheduleController', function($scope, $http) {
        $http({
          method: 'GET',
          url: 'http://store.hedo/schedule.json'
        }).then(function (response) {
            $scope.schedule = response.data.schedule.conference;
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
            controller: function ($scope, $timeout) {
                $scope.$watch('day', function(newVal) {
                    if (!newVal) {
                        return
                    }
                    $scope.hours = [
                        '00', '01', '02', '03', '04', '05', '06', '07', '08', '09',
                        '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
                        '20', '21', '22', '23', '24'
                    ];
                    $scope.events = [];
                    _.each($scope.day.rooms, function (room) {
                        _.each(room, function (ev) {
                            $scope.events.push(ev);
                        })
                    });
                    $('.events').addClass('loading');
                    // dom sensitive
                    $timeout(function() {
                        //positions
                        _.each($scope.events, function (ev) {
                            var slot_id = '#slot-' + ev.start.split(':')[0] + '-' + ev.start.split(':')[1];
                            ev.top = $(slot_id).position().top;
                            ev.height = ev.duration.split(':')[0] * 4 * 75 + (ev.duration.split(':')[1] / 15) * 75;
                            ev.left = 30;
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