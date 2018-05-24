//animateable attributes:
// opacity, transform, 
//export {Janimate};
// if prop is a string than its css!
/*animatable => {
    targets : {} || [] || ''
    prop1 : 
    prop2 
    eases : {} || [{}] || function,
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
        }
    }
    const reservedAnimatableProperties = ['update', 'done', 'targets', 'eases'];
    const animationFactory = (() => {
        let factory = {};
        function createAnimatebleTarget(target) {
            return {
                animatable : target,
                startState : (target.style) ? copy(target.style) : copy(target)
            }
        }
        function getTargets(targets) {
            let animatedTargets = [];
            if (targets.length) {
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
            for (property in animatable) {
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
                eases : getEases(animateObj.eases) 
            }
        }
        // TODO: a way to have animations trigger each other
        // and other events.
        /*factory.createChain = () => {

        }*/
        return factory;
    })();
    const cssProperties = ['opacity', 'width', 'height', 'left', 'top', 'right', 'bottom', 'translateX', 'translateY', 'rotate'];
    const animationRendererFactory = (() => {
        let factory = {}
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
        //currentTime, startingPropVal, changeInValue, duration
        function tick(timeStamp, elapsedTime, animation) {
            let finished = false;
            for (property in animation.properties) {
                if (reservedAnimatableProperties.includes(property)) {
                    continue;
                }
                let desiredValue = animation.properties[property];
                for (let i = 0; i < animation.targets.length; i++) {
                    let target = animation.targets[i];
                    let isDOM = (target.animatable.style !== undefined);
                    if (elapsedTime >= animation.duration) {
                        if (target.animatable.style) {
                            target.animatable.style[property] = setCssValue(property, desiredValue);
                        } 
                        else {
                            target.animatable[property] = desiredValue;
                        }
                        if (target.animatable.update) {
                            let obj = {};
                            obj[property] = desiredValue;
                            target.animatable.update(obj);
                        }
                        if (target.animatable.done) {
                            target.animatable.done();
                        }
                        finished = true;
                    }
                    else {
                        
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
                        if (target.animatable.update) {
                            let obj = {};
                            obj[property] = currentValue;
                            target.animatable.update(obj);
                        }
                    }
                    
                }
            }
            return finished;
        }
        factory.createRenderer = () => {
            return {
                tick : tick
            }
        }
        return factory;
    })();
    let animations = []
    let finishedAnimations = [];
    let raf = 0;
    
    const animationEngine = (() => {
        let renderer = animationRendererFactory.createRenderer();
        let startTime;
        let currentTime;
        let isPaused;
        function play() {
            isPaused = false;
            raf = requestAnimationFrame(tick);
        }
        function pause() {
            isPaused = true;
            startTime = currentTime;
        }
        function tick(timeStamp) {
            if (animations.length && !isPaused) {
                if (!startTime) {
                    startTime = timeStamp
                }
                currentTime = timeStamp - startTime;
                if (currentTime)
                for (let i = 0; i < animations.length; i++) {
                    let finished = renderer.tick(timeStamp, currentTime, animations[i]);
                    if (finished) {
                        finishedAnimations.push(animations[i]);
                        animations.splice(i, 1);
                        delete animations[i];
                    }
                    
                } 
                ref = requestAnimationFrame(tick);
            }
            else if (!animations.length) {
                startTime = undefined;
            }
            else {
                cancelAnimationFrame(ref);
            }
            
            
        }
        return {
            play : play,
            pause : pause,
            stop : stop,
        }
    })();

    let lively = {};

    lively.animate = (animateObj, durationMs) => {
        let animatable = animationFactory.createAnimation(animateObj, durationMs);
        animations.push(animatable);
    }
    lively.play = animationEngine.play;
    lively.pause = animationEngine.pause;
    return lively;
}));