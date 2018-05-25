//animateable attributes:
// opacity, transform, 
//export {Janimate};
// if prop is a string than its css!
/*animatable => {
    targets : {} || [] || ''
    prop1 : 
    prop2 
    eases : string ||{} || [{}] || function,
    // invoke a function when a certain property value is met
    trigger : {}

}*/
(function (context, configure) {
    context.lively = configure();
}(this, () => {
   
    
    function copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    const easings = {
        default :  (currentTime, initialValue, changeInValue, duration) => {
            return changeInValue * (currentTime / duration) + initialValue;
        },
        easeInQuad : (currentTime, initialValue, changeInValue, duration) => {
            return changeInValue*(currentTime/=duration)*currentTime + initialValue;
        },
        easeOutQuad : (t, b, c, d) => {
            return -c * (t/=d)*(t-2) + b;
        },
        easeInOutQuad: function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },
        
    };
    const reservedAnimatableProperties = ['update', 'done', 'targets', 'eases', 'discard'];
    const animationFactory = (() => {
        let factory = {};
        function createAnimatebleTarget(target) {
            return {
                animatable : target,
                startState : (target.style) ? copy(target.style) : copy(target)
            };
        }
        function getTargets(targets) {
            let animatedTargets = [];
            if (typeof targets === 'string') {
                let createdTargets = document.querySelectorAll(targets);
                for (let i = 0; i < createdTargets.length; i++) {
                    animatedTargets.push(createAnimatebleTarget(createdTargets[i]));
                }
            }
            else if (targets.length) {
                for (let i = 0; i < targets.length; i++) {
                    animatedTargets.push(createAnimatebleTarget(target[i]));
                }
            }
            else if (targets) {
                animatedTargets.push(createAnimatebleTarget(targets));
            }
            return animatedTargets;
        }
        function getProperties(animatable) {
            let desiredPropertyValues = {};
            for (let property in animatable) {
                if (!reservedAnimatableProperties.includes(property)) {
                    desiredPropertyValues[property] = animatable[property];
                }
            }
            return desiredPropertyValues;
        }
        function getEases(eases) {
            let animationEases = {
                default : easings.default
            };
            if (typeof eases === 'function') {
                animationEases.default = eases;
            }
            else if (typeof eases === 'string') {
                animationEases.default = easings[eases];
            }
            else if (eases && eases.length) {
                for (let i = 0; i < eases.length; i++) {
                    if(eases[i].property) {
                        animationEases[property] = eases[i].ease;
                    }
                }
            }
            return animationEases;
        }
        factory.createAnimation = (animateObj, durationMs) => {
            return {
                duration : durationMs,
                targets : getTargets(animateObj.targets),
                properties : getProperties(animateObj),
                eases : getEases(animateObj.eases),
                preserve : animateObj.preserve,
                onDone : animateObj.done,
                onUpdate : animateObj.update
            };
        };
        // TODO: a way to have animations trigger each other
        // and other events.
        /*factory.createChain = () => {

        }*/
        return factory;
    })();
    const cssProperties = ['opacity', 'width', 'height', 'left', 'top', 'right', 'bottom', 'translateX', 'translateY', 'rotate'];
    const animationRendererFactory = (() => {
        let factory = {};
        function setCssValue(cssProperty, value) {
            if (cssProperty === 'opacity') {
                return parseFloat(value) + '';
            }
            else {
                return parseInt(value) + 'px';
            }
        }
        function getValueFromCSS(cssProperty, value) {
            if (cssProperty === 'opacity') {
                return parseFloat(value);
            }
            else {
                return parseInt (value, 10);
            }
        }
        function tick(elapsedTime, animation) {
            let finished = false;
            for (let property in animation.properties) {
                if (reservedAnimatableProperties.includes(property)) {
                    continue;
                }
                let desiredValue = animation.properties[property];
                for (let i = 0; i < animation.targets.length; i++) {
                    let target = animation.targets[i];
                    let isDOM = (target.animatable.style !== undefined);
                    // Check if the animation is completed
                    if (elapsedTime >= animation.duration) {
                        if (target.animatable.style) {
                            target.animatable.style[property] = setCssValue(property, desiredValue);
                        } 
                        else {
                            target.animatable[property] = desiredValue;
                        }
                        if (animation.onUpdate) {
                            let obj = {};
                            obj[property] = desiredValue;
                            animation.onUpdate(obj);
                        }
                        if (animation.onDone) {
                            animation.onDone(target);
                        }
                        finished = true;
                    }
                    else {
                        // Animation is not completed, animate the given property.
                        let startValue = (isDOM) ? getValueFromCSS(property, target.startState[property]) : target.startState[property];
                        let changeInValue = ((isDOM) ? getValueFromCSS(property, desiredValue) : desiredValue) - startValue;
                        let tween = (animation.eases[property]) ? animation.eases[property] : animation.eases.default;
                        let currentValue;
                        if (cssProperties.includes(property) && isDOM) {
                            currentValue = getValueFromCSS(property, target.animatable.style[property]);
                            target.animatable.style[property] = setCssValue(property, tween(elapsedTime, startValue, changeInValue, animation.duration));
                        }
                        else {
                            currentValue = target.animatable[property];
                        }    
                        if (animation.onUpdate) {
                            let obj = {};
                            obj[property] = currentValue;
                            animation.onUpdate(obj);
                        }
                    }
                    
                }
            }
            return finished;
        }
        factory.createRenderer = () => {
            return {
                tick : tick
            };
        };
        return factory;
    })();


    let queuedAnimations = [];
    let finishedAnimations = [];
    let raf = 0;
    
    const animationEngine = (() => {
        let renderer = animationRendererFactory.createRenderer();
        let startTime = 0,
         elapsedTime = 0, 
         pauseTime = 0,
         isPaused = false, 
         isStopped = false;
        function play() {
            isPaused = isStopped = false;
            raf = requestAnimationFrame(tick);
        }
        function pause() {
            isPaused = true;
        }
        function stop() {
            isStopped = true;
            startTime = 0;
            elapsedTime = 0;
            pauseTime = 0;
            if (finishedAnimations.length) {
                queuedAnimations = [].concat(finishedAnimations);
                finishedAnimations = [];
            }
        }
        function reset() {
            renderer = animationRendererFactory.createRenderer();
            startTime = undefined;
            elapsedTime = undefined;
            isPaused = false;
        }
        function tick(timeStamp) {
            if (queuedAnimations.length && !isStopped) {
                if (!startTime) {
                    startTime = timeStamp;
                }
                
                if (isPaused) {
                    pauseTime = (timeStamp - startTime) - elapsedTime;
                    elapsedTime = (timeStamp - startTime) - pauseTime; 
                }
                else {
                    elapsedTime = (timeStamp - startTime) - pauseTime; 
                }
                for (let i = 0; i < queuedAnimations.length; i++) {
                    let finished = renderer.tick(elapsedTime, queuedAnimations[i]);
                    if (finished) {
                        if (!queuedAnimations[i].preserve) {
                            finishedAnimations.push(queuedAnimations[i]);
                        }
                        queuedAnimations.splice(i, 1);
                        delete queuedAnimations[i];
                    }
                }

                ref = requestAnimationFrame(tick);
            }
            else {
                cancelAnimationFrame(ref);
                stop();
            }
            
            
        }
        return {
            play : play,
            pause : pause,
            stop : stop,
            reset : reset,
        };
    })();

    let lively = {};
    lively.reset = () => {
        queuedAnimations = [];
        finishedAnimations = [];
        animationEngine.reset();
    };
    lively.easings = easings;
    lively.animate = (animateObj, durationMs) => {
        let animation = animationFactory.createAnimation(animateObj, durationMs);
        queuedAnimations.push(animation);
    };
    lively.play = animationEngine.play;
    lively.pause = animationEngine.pause;
    lively.stop = animationEngine.stop;

    return lively;
}));