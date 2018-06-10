
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
                $scope.$apply();
            }
        });
        lively.animate({
            targets : 'div',
            //x : '50',
            //height : 20,
            'background-color': '#ff9679',
            scaleX : .25,
            scaleY : 0.25,
            rotate: 360,
            translateX : -20,
            translateY : 200,
            'border-radius' : 50,
            //width: 20,
            //opacity : 0,
            update: function() {
            },
            eases : 'easeOutQuad',
            preserve : true,
        }, 2000);

    });

    $scope.onClick = function () {
        lively.play();
    };
    
    $scope.message = "Hello, AngularJS";	
});

