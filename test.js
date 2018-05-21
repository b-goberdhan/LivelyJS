
var app = angular.module("app", []);
app.controller("HelloController", function($scope, $element, $timeout) {
    $scope.obj1 = { opacity : 0,
                    left: 0 };
    $scope.getObj1 = function() {
        var o = angular.copy($scope.obj1);
        o.left = $scope.obj1.left + 'px';
        return o;
    }
    $scope.onClick = function () {
        var obj = { charged : 0};
        janimate({
            target : "div",
            opacity : 1,
            //left: 300,
            update: function(updatedProps) {
                //$scope.$apply();
                console.log(updatedProps);
                //var el = document.querySelector('#JSobject pre');
                //el.innerHTML = JSON.stringify(obj);
            },
            done : function () {
                $scope.obj1 = 
                { opacity : 0,
                    left: 0 
                };
            },
            ease : easeInQuadTween
        }, 250)
        .play();
        /*janimate({
            target : $scope.obj1,
            opacity : 1,
            left: 300,
            update: function(updatedProps) {
                $scope.$apply();
                console.log(updatedProps);
                //var el = document.querySelector('#JSobject pre');
                //el.innerHTML = JSON.stringify(obj);
            },
            done : function () {
                $scope.obj1 = 
                { opacity : 0,
                    left: 0 
                };
            },
            ease : easeInQuadTween
        }, 250)
        .play(); */
        //animator.play();
    }
    
    $scope.message = "Hello, AngularJS";	
});

