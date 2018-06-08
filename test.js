
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
            targets : '#mydiv1',
            //x : '50',
            //height : 20,
            //rotate : 360,
            translateX : -20,
            translateY : 200,
            'border-radius' : 50,
            //width: 20,
            //opacity : 0,
            update: function() {
                // $scope.$apply();
                console.log('update');
            },
            eases : 'easeOutQuad',
            preserve : true,
            done : function () { console.log('done'); },
        }, 2000);
        lively.animate({
            targets : $scope.obj1,
            x : 100,
            done : function () {
                console.log('done2');
            }
        }, 2000);

    });

    $scope.onClick = function () {
        var node = document.querySelector("div");
        lively.play();
    };
    
    $scope.message = "Hello, AngularJS";	
});

