(function (context, configure) {
    context.lively = configure();
}(this, () => {
   
    function copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    // Easing functions
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
    // Css related constants
    const reservedAnimatableProperties = ['update', 'done', 'targets', 'eases', 'preserve'];
    const cssProperties = ['opacity', 'width', 'height', 'left', 'top', 'right', 'bottom'];
    const cssTransformProperties = ['translateX', 'translateY', 'rotate', 'scaleX', 'scaleY'];
    const cssTransformFilters = (() => {

        let removeParenthesesRegex = /[^()]+/;
        let isolatePropertyValueRegex = /\(([^()])+\)/;
        function filter(string, regex) {
            let result = string.match(regex);
            return result ? result[0] : undefined;
        }
        function removeParentheses(string) { 
            return filter(string, removeParenthesesRegex);
        }
        function isolatePropertyValue(string) { 
            return filter(string, isolatePropertyValueRegex); 
        }
        return {
            
            removeParenthesesRegex : removeParenthesesRegex,
            isolatePropertyValueRegex : isolatePropertyValueRegex,

            removeParentheses : removeParentheses,
            isolatePropertyValue : isolatePropertyValue,
            isolateValueAndRemoveParentheses : (string) => {
                let value = filter(string, isolatePropertyValueRegex);
                return value ? filter(value, removeParenthesesRegex) : undefined;
            }
        };
        
    })();
    const cssPropertyDefaults = {
        opacity : 1,
        translateX : 0,
        translateY : 0,
        scaleX : 1,
        scaleY : 1,
        rotate : 0,
        top : 0,
        left: 0,
        right : 0,
        bottom : 0
    };

    // Animation related constants
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
            let transform = {
                translateX : undefined,
                translateY : undefined,
                rotate : undefined,
                scaleX : undefined,
                scaleY : undefined
            };
            for (let property in animatable) {
                if (!reservedAnimatableProperties.includes(property)) {
                    if (cssTransformProperties.includes(property)) {
                        if (!desiredPropertyValues.transform) {
                            desiredPropertyValues.transform = transform;
                        }
                        desiredPropertyValues.transform[property] = animatable[property];
                    }
                    else {
                        desiredPropertyValues[property] = animatable[property];  
                    }
                    
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
                    for (property in eases[i]) {
                        animationEases[property] = eases[i][property];
                        break;
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
        return factory;
    })();

    const rendererFactory = (() => {
        let factory = {};
        function removeCssType(cssValue) {
            if (cssValue) {
                return parseInt(cssValue, 10);
            }
        }
        function getTransformFromCss(cssValue) {
            let matrix = {};
            //translateValues
            if (cssValue === '') {
                return matrix;
            }
            else if (cssValue.startsWith('translateX(')) {
                matrix.translateX = removeCssType(cssTransformFilters.isolateValueAndRemoveParentheses(cssValue));
            }
            else if (cssValue.startsWith('translateY(')) {
                matrix.translateY = removeCssType(cssTransformFilters.isolateValueAndRemoveParentheses(cssValue));
            }
            else if (cssValue.startsWith('translate(')) {
                let translate = cssTransformFilters.isolateValueAndRemoveParentheses(cssValue).split(',');
                matrix.translateX = removeCssType(translate[0], 10);
                matrix.translateY = removeCssType(translate[1], 10);
            }
            else if (cssValue.startsWith('scaleX(')) {
                matrix.scaleX = removeCssType(cssTransformFilters.isolateValueAndRemoveParentheses(cssValue));
            }
            else if (cssValue.startsWith('scaleY(')) {
                matrix.scaleY = removeCssType(cssTransformFilters.isolateValueAndRemoveParentheses(cssValue));
            }
            else if (cssValue.startsWith('scale(')) {
                matrix.scaleX = removeCssType(cssTransformFilters.isolateValueAndRemoveParentheses(cssValue));
                matrix.scaleY = removeCssType(cssTransformFilters.isolateValueAndRemoveParentheses(cssValue));
            }
            else if (cssValue.startsWith('rotate(')) {
                matrix.rotate = removeCssType(cssTransformFilters.isolateValueAndRemoveParentheses(cssValue));
            }
            return matrix;
        } 
        function getValueFromCSS(cssProperty, cssValue) {

            if (cssProperty === 'opacity') {
                if (cssValue === '') {
                    return cssPropertyDefaults.opacity;
                }
                return parseFloat(cssValue);
            }
            else if (cssProperty === 'transform') {
                return getTransformFromCss(cssValue);
            }
            else {
                if (cssValue === '') {
                    return cssPropertyDefaults[cssProperty];
                }
                return removeCssType(cssValue);
            }
        }
        function getCssFromValue(cssProperty, value) {
            if (cssProperty === 'opacity') {
                return parseFloat(value) + '';
            }
            else if (cssProperty === 'transform') {
                let scaleX = value.scaleX ? value.scaleX + 'px' : '1';
                let scaleY = value.scaleY ? value.scaleY + 'px' : '1';
                let translateX = value.translateX ? value.translateX + 'px' : '0';
                let translateY = value.translateY ? value.translateY + 'px' : '0';
                let rotate = value.rotate ? value.rotate + 'deg' : '0';
                return 'scale(' + scaleX + ',' + scaleY + ') translate(' +  translateX + ',' + translateY +') rotate(' + rotate + ')';
            }
            else {
                return parseInt(value) + 'px';
            }
        }
        function renderCssStyle(elapsedTime, animation, property) {
            let desiredValue = animation.properties[property];
            for (let i = 0; i < animation.targets.length; i++) {
                let target = animation.targets[i];
                // Check if the animation is completed
                if (elapsedTime >= animation.duration) {
                    target.animatable.style[property] = getCssFromValue(property, desiredValue);
                }
                else {
                    // Animation is not completed, animate the given property.
                    let startValue = getValueFromCSS(property, target.startState[property]);
                    let changeInValue = getValueFromCSS(property, desiredValue) - startValue;
                    let tweenName = (animation.eases[property]) ? animation.eases[property] : 'default';
                    let tween = easings[tweenName]; 
                    let currentValue = getValueFromCSS(property, target.animatable.style[property]);
                    target.animatable.style[property] = getCssFromValue(property, tween(elapsedTime, startValue, changeInValue, animation.duration));  
                }          
            }
        }
        function renderCssTransform(elapsedTime, animation) {
            let desiredValue = animation.properties.transform; 
            for (let i = 0; i < animation.targets.length; i++) {
                let target = animation.targets[i];
                // Check if the animation is completed
                if (elapsedTime >= animation.duration) {
                    target.animatable.style.transform = getCssFromValue('transform', desiredValue);
                }
                else {
                    // Animation is not completed, animate the given property.
                    let startValues = getValueFromCSS('transform', target.startState.transform);
                    let transform = {};

                    for (var transformProp in desiredValue) {
                        if (!desiredValue[transformProp]) {
                            continue;
                        }
                        let startValue = (startValues[transformProp]) ? startValues[transformProp] : 0;
                        let changeInValue = (desiredValue[transformProp]) - startValue;
                        let tweenName = (animation.eases[transformProp]) ? animation.eases[transformProp] : 'default';
                        let tween = easings[tweenName]; ;
                        transform[transformProp] = tween(elapsedTime, startValue, changeInValue, animation.duration);
                    }
                    target.animatable.style.transform = getCssFromValue('transform', transform);  
                }
                
            }
        }
        function renderObject(elapsedTime, animation, property) {
            let desiredValue = animation.properties[property];
            for (let i = 0; i < animation.targets.length; i++) {
                let target = animation.targets[i];
                // Check if the animation is completed
                if (elapsedTime >= animation.duration) {
                    target.animatable[property] = desiredValue;
                }
                else {
                    // Animation is not completed, animate the given property.
                    let startValue = target.startState[property];
                    let changeInValue = desiredValue - startValue;
                    let tweenName = (animation.eases[property]) ? animation.eases[property] : 'default';
                    let tween = easings[tweenName]; 
                    let currentValue = target.animatable[property];
                    target.animatable[property] = tween(elapsedTime, startValue, changeInValue, animation.duration);
                    
                }   
            }
        }
        function tick(elapsedTime, animation) {
            for (let property in animation.properties) {
                if (reservedAnimatableProperties.includes(property)) {
                    continue;
                }

                if (cssProperties.includes(property)) {
                    renderCssStyle(elapsedTime, animation, property);
                }
                else if (property === 'transform') {
                    renderCssTransform(elapsedTime, animation, property);
                }
                else {
                    renderObject(elapsedTime, animation, property);
                }

                if (elapsedTime >= animation.duration) {
                    return true;
                }
            }
            return false;
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
    let lively = {};
    let config = {};
    lively.configure = (options) => {
        config.onRenderTick = options.onRenderTick;
        config.preserveAll = options.preserveAll;
        config.onAllAnimationsComplete = options.onAllAnimationsComplete;
    };

    const animationEngine = (() => {

        let renderer = rendererFactory.createRenderer(); 
        let startTime = 0;
        let elapsedTime = 0;
        let pauseTime = 0;
        let isPaused = false; 
        let isStopped = false;

        function play() {
            isPaused = isStopped = false;
            raf = requestAnimationFrame(tick);
        }
        function pause() {
            isPaused = true;
        }
        function stop() {
            isStopped = true;
            startTime = undefined;
            elapsedTime = 0;
            pauseTime = 0;
            if (finishedAnimations.length) {
                queuedAnimations = [].concat(finishedAnimations);
                finishedAnimations = [];
            }
        }
        function reset() {
            renderer = rendererFactory.createRenderer();
            startTime = undefined;
            elapsedTime = undefined;
            isPaused = false;
        }
        function renderAnimations(elapsedTime) {
            for (let i = 0; i < queuedAnimations.length; i++) {
                if (queuedAnimations[i]) {
                    let finished = renderer.tick(elapsedTime, queuedAnimations[i]);
                    if (queuedAnimations[i].onUpdate && !isPaused) {
                        queuedAnimations[i].onUpdate(queuedAnimations[i].target);
                    }
                    
                    if (finished) {
                        if (queuedAnimations[i].onDone) {
                            queuedAnimations[i].onDone(queuedAnimations[i].target);
                        }
                        if (queuedAnimations[i].preserve) {
                            finishedAnimations.push(queuedAnimations[i]);
                        }
                        queuedAnimations.splice(i, 1);
                    }
                }
            }
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
                renderAnimations(elapsedTime);
                if (config.onRenderTick) {
                    config.onRenderTick();
                }
                ref = requestAnimationFrame(tick);
            }
            else {
                cancelAnimationFrame(ref);
                stop();
                if (config.onAllAnimationsComplete) {
                    config.onAllAnimationsComplete();
                }
            }
            
            
        }
        return {
            play : play,
            pause : pause,
            stop : stop,
            reset : reset
        };
    })();

    
    lively.reset = () => {
        queuedAnimations = [];
        finishedAnimations = [];
        animationEngine.reset();
    };
    lively.easings = easings;
    lively.animate = (animateObj, durationMs) => {
        let animation = animationFactory.createAnimation(animateObj, durationMs);
        queuedAnimations.push(animation);
        return queuedAnimations.length - 1;
    };
    lively.play = animationEngine.play;
    lively.pause = animationEngine.pause;
    lively.stop = animationEngine.stop;

    return lively;
}));