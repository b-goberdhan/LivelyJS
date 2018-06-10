
var app = angular.module("app", []);
app.controller("HelloController", function($scope, $element, $timeout) {
    $scope.obj1 = { x : 0 };
    $scope.getObj1 = function() {
        var o = angular.copy($scope.obj1);
        o.left = $scope.obj1.left + 'px';
        return o;
    };

    $timeout(function () {
        lively.configure({
            onRenderTick : function () {
               // $scope.$apply();
            }
        });
        lively.easings['bounce'] = function (t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
            }
        };
        lively.animate({
            targets : 'div',
            rotate: 360,
            translateX : 200,
            'border-radius' : 50,
            'background-color': '#3d4573',
            eases : [
                { translateX: 'bounce'},
                { rotate: 'bounce'},
                {'border-radius': 'easeOutQuad'}
            ],
            preserve : true
        }, 1000);

    });

    $scope.onClick = function () {
        lively.play();
    };
    
    $scope.message = "Hello, AngularJS";	
});

