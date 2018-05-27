
var app = angular.module("app", []);
app.controller("HelloController", function($scope, $element, $timeout) {
    $scope.obj1 = { x : 0 };
    $scope.getObj1 = function() {
        var o = angular.copy($scope.obj1);
        o.left = $scope.obj1.left + 'px';
        return o;
    };
    lively.animate({
        targets : 'div',
        //x : '50',
        //height : 20,
        //width: 20
        opacity : 0,
        update: function() { 
           // $scope.$apply();
            console.log('update'); 
        },
        eases : 'default',
        preserve : true,
        done : function () { console.log('done'); },
    }, 5000);
    lively.animate({
        targets : 'div',
        //x : '50',
        //height : 20,
        //width: 20,
        translateX: 100,
        translateY : 50,
        rotate: 360,
        update: function() { 
           // $scope.$apply();
            console.log('update'); 
        },
        eases : 'easeOutQuad',
        preserve : true,
        done : function () { console.log('done'); },
    }, 5000);

    $scope.onClick = function () {
        var node = document.querySelector("div");
        lively.play();
    };
    
    $scope.message = "Hello, AngularJS";	
});

