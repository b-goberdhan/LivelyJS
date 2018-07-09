window.onload = function () {
    var objs = [{ x : 0}, {x: 2}];
    var divs = document.querySelectorAll('div');
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
        targets : divs,
        //x : 200,
        update: function () {
            //console.log(objs[0].x + ' 1');
            //console.log(objs[1].x + ' 2');
        },
        rotate : [{ '20%' : 180 } , { '85%' : 180 }, { '100%': 360}] ,
        translateX : {'100%' : 200 },
        scaleX : [{ '20%' : .5 }, { '90.5%' : 2}, {'100%' : 1}],
        scaleY : [{ '50%' : .5 }, { '95%' : 2}, {'100%' : 1}],
        //translateY : [{'10%' : 40 }, { '25%' : -40 }, { '100%' : 40 }],
        'opacity' : [{ '25%' : 0.1}, { '50%' : 1}, { '75%' : .5}, {'100%' : 1}],
        'background-color':  [{ '20%' : '#2345ff'}, { '50%' : '#22ff3c'}, { '100%' : '#ffcf21' }],
        //'font-size' : [{ '10%' : '50px' }],
        //'background-color' : '#000',
        //'color' : '#852234',
        //'border-radius' :  [{ '0%' : 0 }, {'20%' : '50%'}],
        eases : [
            { translateX: 'bounce'},
            { rotate: 'bounce' },
            { 'font-size': 'bounce' }
        ],

        preserve : true
    }, 5000);
    document.getElementById('mydiv1').onclick = function() {

        //lively.play();
        lively.promise.play().then((resolve) => {
           console.log('done!!');
        });
    };
};


