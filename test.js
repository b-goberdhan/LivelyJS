window.onload = function () {
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
        //srotate : 360 ,
        //translateX : [{ '20%' : 20}, {'60%' : 200 }],

        'opacity' : [{ '25%' : 0.1}, { '50%' : 1}, { '75%' : .5}, {'100%' : 1}],
        'background-color':  [{ '20%' : '#2345ff'}, { '50%' : '#22ff3c'}, { '100%' : '#ffcf21' }],
        'font-size' : [{ '100%' : 50 }],
        //'background-color' : '#000',
        'border-radius' :  '50%' ,
        eases : [
            //{ translateX: 'bounce'},
            //{ rotate: 'bounce'},
            {'font-size': 'bounce'}
        ],

        preserve : true
    }, 1000);
    document.getElementById('mydiv1').onclick = function() {
        lively.play();
    };
};


