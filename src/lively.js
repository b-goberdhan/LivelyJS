function Animator(animation, duration) {
    this.animation = animation;
    this.duration = duration;
    this.isPlaying = undefined;
    this.animationFrame = undefined;
    this.targetPropertyKeys = undefined;
    this.startProperties = undefined;
    this.startTime = undefined;

    this.play = function() {
        if (typeof this.animation.target === 'string') {
            this.animation.target = document.querySelectorAll(this.animation.target);
        }
        this.targetPropertyKeys = getTargetedProperties(animation);
        this.startProperties = getInitialTargetPropertyValues(this.targetPropertyKeys, this.animation);
        this.animationFrame = requestAnimationFrame(this.animate);
        this.isPlaying = true;
        
    };

    this.stop = function() {
        this.isPlaying = false;
        if (this.animationFrame) {
           cancelAnimationFrame(this.animationFrame);
        }
    };

    this.animate = function(timeStamp) {
        if (!this.startTime) {
            this.startTime = timeStamp;
        }
        var currentTime = timeStamp - this.startTime;
        if (isCollection(this.animation.target)) {
            if (this.animation.target.constructor === Array) {
                this.targetPropertyKeys.forEach(function (key) {
                    for (var i = 0; i < this.animation.target.length; i++) {
                        this.animation.target[i][key] = tweenProperty(currentTime, key, this.duration, this.startProperties[i][key], this.animation.ease);
                    }
                }.bind(this));
            }
            else if (this.animation.target.constructor === NodeList) {
                this.targetPropertyKeys.forEach(function (key) {
                    for (var i = 0; i < this.animation.target.length; i++) {
                        var startVal = getValueFromCSS(key, this.startProperties[i][key]);
                        animation.target[i].style[key] = setCssValue(key, tweenProperty(currentTime, key, this.duration, startVal, this.animation.ease));
                    }
                }.bind(this));
            }

        }
        else {
            if (this.animation.target.style) {
                this.targetPropertyKeys.forEach(function (key) {
                    var startVal = getValueFromCSS(key, this.startProperties[key]);
                    this.animation.target.style[key] = setCssValue(key, tweenProperty(currentTime, key, this.duration, startVal, this.animation.ease));
                }.bind(this));
            }
            else {
                this.targetPropertyKeys.forEach(function(key) {
                    this.animation.target[key] = tweenProperty(currentTime, key, this.duration, this.startProperties[key], this.animation.ease);
                }.bind(this));
            }


        }

        var doneAnimation = (currentTime >= duration);
        if (doneAnimation) {
            this.stop();
            if (this.animation.update) {
                var updatedProps = [];
                this.targetPropertyKeys.forEach(function (key) {
                    var obj = {};
                    obj[key] = this.animation.target[key];
                    updatedProps.push(obj);
                }.bind(this));
                this.animation.update(updatedProps);
            }
            if (this.animation.done) {
                this.animation.done();
            }
        }
        else {
            requestAnimationFrame(this.animate);
        }
        
    }.bind(this);

    var tweenProperty = function(currentTime, key, duration, startVal, ease) {
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

        if (this.animation.update) {
            var obj = {};
            obj[key] = tweenedValue;
            this.animation.update([obj]);
        }
        return tweenedValue;
    }.bind(this);
    // helpers
    function filterTargetAnimationKey(key) {
        return key !== 'target' && key !== 'update' && key !== 'ease' && key !== 'done';
    }
    function getInitialTargetPropertyValues(targetKeys, animation) {
        var startingProperties = {};
        if (isCollection(animation.target)) {
            targetKeys.forEach(function (key) {
                for (var i = 0; i < animation.target.length; i++) {
                    startingProperties[i] = {};
                    if (animation.target[i].style) {
                        startingProperties[i][key] = animation.target[i].style[key];
                    }
                    else {
                        startingProperties[i][key] = animation.target[i][key];
                    }

                }
            });
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
    function targetHasOwnProperty(target, animateKey) {
        return target && target.hasOwnProperty(animateKey) || (target.style && target.style.hasOwnProperty(animateKey));
    }
    function hasProperty(target, propertyName) {
        if (target.constructor === Object) {
            return targetHasOwnProperty(target, propertyName);
        }
        else if (target.constructor === NodeList) {
            for (var i = 0; i < target.length; i++) {
                if (!targetHasOwnProperty(target[i], propertyName)) {
                    return false;
                }
            }
            return true;
        }
        return target.every(function (target) {
            return targetHasOwnProperty(target, propertyName);
        });
    }
    function getTargetedProperties(animation) {
        var propKeys = [];

        for (var property in animation) {
            if (animation.hasOwnProperty(property) && filterTargetAnimationKey(property)) {
                //now make sure the animation targets has this property

                // make sure the targeted property is present in the animation target(s)
                // if there are multiple elements and one of the elements does not have a targeted
                // property, then the animation on that property is not applied.
                var elementsHaveTargetedProps = hasProperty(animation.target, property);

                if (elementsHaveTargetedProps) {
                    propKeys.push(property);
                }
                else {
                    delete animation[property];
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
        switch (property) {
            case 'opacity':
                return parseFloat(value);
            case 'height':
            case 'width':
            case 'left':
            case 'top':
            case 'right':
            case 'bottom':
                return parseInt(value, 10);
        }
    }
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



function Lively(targetAnimation, duration) {
    this.animator = new Animator(targetAnimation, duration);
    this.play = function () { this.animator.play(); };
    this.stop = function () { this.animator.stop(); };
}

//animateable attributes:
// opacity, transform, 
//export {Janimate};
