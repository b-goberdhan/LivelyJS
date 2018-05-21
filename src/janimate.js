
function filterTargetAnimationKey(key) {
    return key !== 'target' && key !== 'update' && key !== 'ease' && key !== 'done';
}

function getPropKeys(targetAnimation = {}) {
    var propKeys = [];
    for (var animatableKey in targetAnimation) {
        if (targetAnimation.hasOwnProperty(animatableKey) && filterTargetAnimationKey(animatableKey)) {
            propKeys.push(animatableKey);
        }
    }
    return propKeys;
}

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function setCssValue(property, value) {
    if (property === 'opacity') {
        return value;
    }
    else {
        return value + 'px';
    }
}

function getValueFromCSS(property, value) {
    if (property === 'opacity') {
        return parseFloat(value);
    }
    return parseInt(value, 10);
}

function animator(targetAnimationState, duration) {
    var isPlaying,
        DOMElements,
        animationFrame,
        targetPropKeys,
        initialPropVals,
        startTime;

    var play = function() {
        isPlaying = true;
        if (typeof targetAnimationState.target === 'string') {
            DOMElements = document.querySelectorAll(targetAnimationState.target);
        }
        targetPropKeys = getPropKeys(targetAnimationState);
        
        initialPropVals = {};
        targetPropKeys.forEach(function(key) {
            if (DOMElements) {
                DOMElements.forEach(function(element) {
                    initialPropVals[key] = getValueFromCSS(key, element.style[key]);
                });
            }
            else {
                initialPropVals[key] = copy(targetAnimationState.target[key]);
            }
        });
        if (targetPropKeys && targetAnimationState.target) {
            if (!DOMElements) {
                animationFrame = requestAnimationFrame(animate);
            }
            else {
                animationFrame = requestAnimationFrame(animateDOMElements);
            }
            
        }
        
    };

    var stop = function() {
        isPlaying = false;
        if (animationFrame) {
           cancelAnimationFrame(animationFrame);
        }
    };

    var animateDOMElements = function(timeStamp) {
        if (!startTime) {
            startTime = timeStamp;
        }
        var currentTime = timeStamp - startTime;
        targetPropKeys.forEach(function(key) {
            DOMElements.forEach(function(element) {
                var tweenedValue = animateProperty(currentTime, key, duration, targetAnimationState.ease);
                element.style[key] = setCssValue(key, tweenedValue);
            });      
        });
        var doneAnimation = (currentTime >= duration);
        if (doneAnimation) {
            stop();
            if (targetAnimationState.update) {
                var updatedProps = [];
                targetPropKeys.forEach(function (key) {
                    var obj = {};
                    obj[key] = targetAnimationState.target[key];
                    updatedProps.push(obj);
                });
                targetAnimationState.update(updatedProps);
            }
            if (targetAnimationState.done) {
                targetAnimationState.done();
            }
        }
        else {
            requestAnimationFrame(animateDOMElements);
        }

    }
    var animate = function(timeStamp) {
        if (!startTime) {
            startTime = timeStamp;
        }
        var currentTime = timeStamp - startTime;
        //var doneAnimation = false;
        targetPropKeys.forEach(function(key) {
            if (DOMElements) {
                DOMElements.forEach(function(element) {
                    var tweenedValue = animateProperty(currentTime, key, duration, targetAnimationState.ease);
                    element.style[key] = tweenedValue;
                });
            }
            else {
                targetAnimationState.target[key] = animateProperty(currentTime, key, duration, targetAnimationState.ease);
            }
        });

        var doneAnimation = (currentTime >= duration);
        if (doneAnimation) {
            stop();
            if (targetAnimationState.update) {
                var updatedProps = [];
                targetPropKeys.forEach(function (key) {
                    var obj = {};
                    obj[key] = targetAnimationState.target[key];
                    updatedProps.push(obj);
                });
                targetAnimationState.update(updatedProps);
            }
            if (targetAnimationState.done) {
                targetAnimationState.done();
            }
        }
        else {
            requestAnimationFrame(animate);
        }
        
    }

    function animateProperty(currentTime, key, duration, ease) {
        var startingPropVal = initialPropVals[key];
        var desiredPropVal = targetAnimationState[key]
        var tweenedValue;
        
        // If time is up, ensure the tween value is the final.
        if (currentTime >= duration) {
            tweenedValue = desiredPropVal;
        }
        else if (!ease) {
            tweenedValue = linearTween(currentTime, startingPropVal, desiredPropVal, duration);
        }
        else {
            tweenedValue = ease(currentTime, startingPropVal, desiredPropVal, duration);
        }

        if (targetAnimationState.update) {
            var obj = {};
            obj[key] = tweenedValue;
            targetAnimationState.update([obj]);
        }
        return tweenedValue;
    }

    return {
        play : play,
        stop : stop
    }
}
//tweening functions
function linearTween(currentTime, intialValue, finalValue, duration) {
    var delta = finalValue - intialValue;
    return delta * (currentTime / duration) + intialValue;
}

function easeInQuadTween(currentTime, initialValue, finalValue, duration) {
    var delta = finalValue - initialValue;
    var time = (currentTime / duration);
    time = Math.pow(time, 2);
    return (delta * time) + initialValue;
}

const animatableCSS = ['opacity', 'width', 'height', 'translateX', 'translateY']
/**
 * An animation engine for javascript objects
 * Example usage:
 * 
 * var animatedObj = janimate({
 *  target : yourObject,
 *  property1 : 'final numeric value',
 *  property2 : 'final numeric value;
 * })
 */

function janimate(targetAnimation, duration) {
    return animator(targetAnimation, duration); 
}

//animateable attributes:
// opacity, transform, 
//export {Janimate};
