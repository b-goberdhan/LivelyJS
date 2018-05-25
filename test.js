
var app = angular.module("app", []);
app.controller("HelloController", function($scope, $element, $timeout) {
    $scope.obj1 = { opacity : 1,
                    left: 100 };
    $scope.getObj1 = function() {
        var o = angular.copy($scope.obj1);
        o.left = $scope.obj1.left + 'px';
        return o;
    };
    $scope.onClick = function () {
        var node = document.querySelector("div");
        lively.animate({
            targets : 'div',
            opacity: 0,
            update: function() { },
            eases : 'easeInQuad',
            preserve : true,
            done : function () { },
        }, 1000);
        lively.play();
    };
    
    $scope.message = "Hello, AngularJS";	
});

