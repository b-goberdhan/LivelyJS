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
        'opacity' : [{ '25%' : .1}, { '50%' : 1}, { '75%' : .5}],
        //'background-color': 'rgb(0, 56, 200)',
        //'font-size' : { '100%' : 50 },

        //'border-radius' : [{ '100%': 50 }],
/*
        eases : [
            //{ translateX: 'bounce'},
            //{ rotate: 'bounce'},
            //{'border-radius': 'default'}
        ],
        */
        preserve : true
    }, 5000);
    document.getElementById('mydiv1').onclick = function() {
        lively.play();
    };
};


