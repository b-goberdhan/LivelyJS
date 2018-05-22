function animator(animation, duration) {
    var isPlaying,
        animationFrame,
        targetPropertyKeys,
        startProperties,
        startTime;

    var play = function() {
        if (typeof animation.target === 'string') {
            animation.target = document.querySelectorAll(animation.target);
        }
        targetPropertyKeys = getTargetPropKeys(animation);
        startProperties = getStartingProperties(targetPropertyKeys, animation);
        animationFrame = requestAnimationFrame(animate);
        isPlaying = true;
        
    };

    var stop = function() {
        isPlaying = false;
        if (animationFrame) {
           cancelAnimationFrame(animationFrame);
        }
    };

    var animate = function(timeStamp) {
        if (!startTime) {
            startTime = timeStamp;
        }
        var currentTime = timeStamp - startTime;
        if (isCollection(animation.target)) {
            if (animation.target.constructor === Array) {
                targetPropertyKeys.forEach(function (key) {
                    for (var i = 0; i < animation.target.length; i++) {
                        animation.target[i][key] = animateProperty(currentTime, key, duration, startProperties[i][key], animation.ease);
                    }
                });
            }
            else if (animation.target.constructor === NodeList) {
                targetPropertyKeys.forEach(function (key) {
                    for (var i = 0; i < animation.target.length; i++) {
                        var startVal = getValueFromCSS(key, startProperties[i][key]);
                        animation.target[i].style[key] = setCssValue(key, animateProperty(currentTime, key, duration, startVal, animation.ease));
                    }
                });
            }

        }
        else {
            if (animation.target.style) {
                targetPropertyKeys.forEach(function (key) {
                    var startVal = getValueFromCSS(key, startProperties[key]);
                    animation.target.style[key] = setCssValue(key, animateProperty(currentTime, key, duration, startVal, animation.ease));
                });
            }
            else {
                targetPropertyKeys.forEach(function(key) {
                    animation.target[key] = animateProperty(currentTime, key, duration, startProperties[key], animation.ease);
                });
            }


        }

        var doneAnimation = (currentTime >= duration);
        if (doneAnimation) {
            stop();
            if (animation.update) {
                var updatedProps = [];
                targetPropertyKeys.forEach(function (key) {
                    var obj = {};
                    obj[key] = animation.target[key];
                    updatedProps.push(obj);
                });
                animation.update(updatedProps);
            }
            if (animation.done) {
                animation.done();
            }
        }
        else {
            requestAnimationFrame(animate);
        }
        
    };



    function animateProperty(currentTime, key, duration, startVal, ease) {
        var startingPropVal = startVal;
        var desiredPropVal = animation[key];
        var changeInValue = desiredPropVal - startVal;
        var tweenedValue;

        // If time is up, ensure the tween value is the final.
        if (currentTime >= duration) {
            tweenedValue = desiredPropVal;
        }
        else if (!ease) {
            tweenedValue = linearTween(currentTime, startingPropVal, changeInValue, duration);
        }
        else {
            tweenedValue = ease(currentTime, startingPropVal, changeInValue, duration);
        }

        if (animation.update) {
            var obj = {};
            obj[key] = tweenedValue;
            animation.update([obj]);
        }
        return tweenedValue;
    }
    // helpers
    function filterTargetAnimationKey(key) {
        return key !== 'target' && key !== 'update' && key !== 'ease' && key !== 'done';
    }
    function getStartingProperties(targetKeys, animation) {
        var startingProperties = {};
        if (isCollection(animation.target)) {
            if (animation.target.constructor === Array) {
                targetKeys.forEach(function (key) {
                    for (var i = 0; i < animation.target.length; i++) {
                        startingProperties[i] = {};
                        startingProperties[i][key] = animation.target[i][key];
                    }
                });
            }
            else if (animation.target.constructor === NodeList) {
                targetKeys.forEach(function (key) {
                    for (var i = 0; i < animation.target.length; i++) {
                        startingProperties[i] = {};
                        startingProperties[i][key] = animation.target[i].style[key];
                    }
                });
            }


        }
        else if (animation.target.style) {
            targetKeys.forEach(function (key) {
                startingProperties[key] = animation.target.style[key];
            });
        }
        else {
            targetKeys.forEach(function (key) {
                startingProperties[key] = animation.target[key];
            });
        }
        return startingProperties;

    }
    function targetPropertiesFound(target, animatableKey) {
        return target && target.hasOwnProperty(animatableKey) || (target.style && target.style.hasOwnProperty(animatableKey));
    }
    function hasTargetedProp(propertyName, target) {
        if (target.constructor === Object) {
            return targetPropertiesFound(target, propertyName);
        }
        else if (target.constructor === NodeList) {
            for (var i = 0; i < target.length; i++) {
                if (!targetPropertiesFound(target[i], propertyName)) {
                    return false;
                }
            }
            return true;
        }
        return targets.every(function (target) {
            return targetPropertiesFound(target, propertyName);
        });
    }
    function getTargetPropKeys(animation) {
        var propKeys = [];

        for (var animatableKey in animation) {
            if (animation.hasOwnProperty(animatableKey) && filterTargetAnimationKey(animatableKey)) {
                //now make sure the animation targets has this property

                //make sure all element have these
                var elementsHaveTargetedProps = hasTargetedProp(animatableKey, animation.target);

                if (elementsHaveTargetedProps) {
                    propKeys.push(animatableKey);
                }
                else {
                    delete animation[animatableKey];
                }
            }
        }
        return propKeys;
    }
    function isCollection(obj) {
        return obj.constructor === Array || obj.constructor === NodeList;
    }
    function setCssValue(property, value) {
        switch (property) {
            case 'opacity':
                return parseFloat(value);
            case 'height':
            case 'width':
            case 'left':
            case 'top':
            case 'right':
            case 'bottom':
                return parseInt(value) + 'px';
        }
    }
    function getValueFromCSS(property, value) {

        if (property === 'opacity') {
            return parseFloat(value);
        }
        return parseInt(value, 10);
    }

    return {
        play : play,
        stop : stop
    };
}
//tweening functions
function linearTween(currentTime, initialValue, changeInValue, duration) {
    return changeInValue * (currentTime / duration) + initialValue;
}
function easeInQuadTween(currentTime, initialValue, changeInValue, duration) {
    var time = (currentTime / duration);
    time = Math.pow(time, 2);
    return (changeInValue * time) + initialValue;
}
function easeInElastic(t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t===0) return b;  if ((t/=d)===1) return b+c;  if (!p) p=d*0.3;
    if (a < Math.abs(c)) { a=c; s=p/4; }
    else s = p/(2*Math.PI) * Math.asin (c/a);
    return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
}
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
