angular.module('hedodash')
    .controller('WeatherController', function($scope, $http){
        $scope.hour_scale = [];
        for (var i=0; i<24; i++)
            if (i%2==0)
                $scope.hour_scale.push(i);

        $http({
            method: 'GET',
            url: globalConfig.weatherUrl
        }).then(function (response) {
            var weather_json = response.data;
            $scope.weather = {};
            $scope.weather.today = {
                'date': new Date(),
                'temp_c': weather_json['current']['temp_c'],
                'temp_f': weather_json['current']['temp_f'],
                'info': weather_json['current']['condition']['text'],
                'icon': weather_json['current']['condition']['icon'].split('/').slice(-1)[0]
            };

            var forecast = [];
            for (var i=0; i < weather_json['forecast']['forecastday'].length; i++){
                var day_json = weather_json['forecast']['forecastday'][i];
                day_json['icon'] =
                    day_json['day']['condition']['icon'].split('/').slice(-1)[0];
                day_json['date'] = new Date(day_json['date']);


                var sunbox = {};
                var hour = parseInt(day_json.astro.sunrise);
                var min = parseInt(day_json.astro.sunrise.split(':')[1]);
                sunbox['sunrise'] = hour + 60/min;
                day_json['sunrise'] = hour + ":" + min;

                hour = parseInt(day_json.astro.sunset)+12;
                min = parseInt(day_json.astro.sunrise.split(':')[1]);
                sunbox['sunset'] = hour + 60/min;
                day_json['sunset'] = hour + ":" + min;

                sunbox['night'] = 24-(hour+60/min);

                day_json['sunbox'] = sunbox;

                forecast.push(day_json);
            }
            $scope.weather.forecast = forecast;

        });
    });