(function (context, configure) {
    context.lively = configure();
}(this, () => {

    // Easing functions
    const easings = {
        'default' :  (currentTime, initialValue, changeInValue, duration) => {
            return changeInValue * (currentTime / duration) + initialValue;
        },
        'easeInQuad' : (currentTime, initialValue, changeInValue, duration) => {
            return changeInValue*(currentTime/=duration)*currentTime + initialValue;
        },
        'easeOutQuad' : (t, b, c, d) => {
            return -c * (t/=d)*(t-2) + b;
        },
        'easeInOutQuad': function (t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },
        
    };
    // NEW CSS STUFF
    const livelyProperties = ['update', 'done', 'targets', 'eases', 'preserve'];
    const cssTransformProperties = ['translateX', 'translateY', 'rotate', 'scaleX', 'scaleY', 'skewX', 'skewY'];
    const cssProperties = ['opacity', 'width', 'height', 'left', 'top', 'right', 'bottom', 'border-radius'];
    const cssColorProperties = ['color', 'background-color', 'border-color', 'fill'];
    function isElement(object) {
        return (object instanceof Element);
    }
    function isObject(object) {
        return (object instanceof Object);
    }
    function setCssValue(element, property, value) {
        if (isElement(element)) {
            element.style[property] = value;
        }
    }
    function getCssValue(element, property) {
        if (isElement(element)) {
            return getComputedStyle(element).getPropertyValue(property);
        }
    }
    function setCssTransform(element, matrix) {
        if (isElement(element) && matrix) {
            let matrixString = 'matrix(' + matrix.scaleX + ', ' + matrix.skewX + ', ' + matrix.skewY + ', ' + matrix.scaleY + ', ' + matrix.translateX + ', ' + matrix.translateY + ')';
            let rotateString = 'rotate(' + (matrix.rotate || 0) + 'deg)';
            element.style.transform = matrixString + ' ' + rotateString;
        }
    }
    function getCssTransform(element) {
        if (isElement(element)) {
            let matrixString = getCssValue(element, 'transform');
            let matrixValues = [1,0,0,1,0,0];
            if (matrixString !== 'none') matrixValues = matrixString.match(/\(([^()])+\)/)[0].match(/[^()]+/)[0].split(',');
            return {
                scaleX : parseFloat(matrixValues[0]),
                skewY : parseFloat(matrixValues[1]),
                skewX : parseFloat(matrixValues[2]),
                scaleY : parseFloat(matrixValues[3]),
                translateX : parseFloat(matrixValues[4]),
                translateY : parseFloat(matrixValues[5]),
                rotate : Math.round(Math.atan2(parseFloat(matrixValues[1]), parseFloat(matrixValues[0])) * 180/Math.PI)
            };
        }
    }
    function getCssUnit(element, property) {
        if (isElement(element)) {
            let styleValue = getComputedStyle(element).getPropertyValue(property);
            if (styleValue.endsWith('px')) return 'px';
            if (styleValue.endsWith('%')) return '%';
            else return '';
        }
    }
    function parseColor(color) {
        if (color.startsWith('rgb(')) {
            let rgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
            if (rgb) {
                return {
                    r : parseInt(rgb[1]),
                    g : parseInt(rgb[2]),
                    b : parseInt(rgb[3])
                }
            }
        }
        else if (color.startsWith('#') && color.length === 4) {
            let rgb = color.match(/^#([0-9a-f]{3})$/i)[1];
            if (rgb) {
                return {
                    r : parseInt(rgb.charAt(0), 16) * 0x11,
                    g : parseInt(rgb.charAt(1), 16) * 0x11,
                    b : parseInt(rgb.charAt(2), 16) * 0x11,
                };
            }
        }
        else if (color.startsWith('#') && color.length === 7) {
            let rgb = color.match(/^#([0-9a-f]{6})$/i)[1];
            if (rgb) {
                return {
                    r : parseInt(rgb.substr(0,2), 16),
                    g : parseInt(rgb.substr(2,2), 16),
                    b : parseInt(rgb.substr(4,2), 16),
                };
            }
        }
    }
    function getRgbValue(element, property) {
        if (isElement(element) && cssColorProperties.includes(property)) {
            let colorString = getCssValue(element, property);
            return parseColor(colorString);
        }
    }
    function setRgbValue(element, property, rgb) {
        if (isElement(element)) {
            element.style[property] = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
        }
    }
    // Animation related constants
    const animationFactory = (() => {
        let factory = {};
        function createAnimatable(target, desiredProperties) {
            let startProperties = {};
            for (let property in desiredProperties) {
                if (isElement(target) && property === 'transform') {
                    startProperties[property] = getCssTransform(target);
                }
                else if (isElement(target) && cssColorProperties.includes(property)) {
                    startProperties[property] = getRgbValue(target, property);
                }
                else if (isElement(target) && cssProperties.includes(property)) {
                    let cssValue = getCssValue(target, property);
                    let unit = getCssUnit(target,property);
                    if (unit !== '') startProperties[property] = parseFloat(cssValue.substring(0, cssValue.indexOf(unit)));
                    else startProperties[property] = parseFloat(cssValue);
                }
                else {
                    startProperties[property] = target[property];
                }

            }
            if (desiredProperties.transform) {
                desiredProperties.transform = {
                    scaleX : !desiredProperties.transform.scaleX ? startProperties.transform.scaleX : desiredProperties.transform.scaleX,
                    skewY : !desiredProperties.transform.skewY ? startProperties.transform.skewY : desiredProperties.transform.skewY,
                    skewX : !desiredProperties.transform.skewX ? startProperties.transform.skewX : desiredProperties.transform.skewX,
                    scaleY : !desiredProperties.transform.scaleY ? startProperties.transform.scaleY : desiredProperties.transform.scaleY,
                    translateX : !desiredProperties.transform.translateX ? startProperties.transform.translateX : desiredProperties.transform.translateX,
                    translateY : !desiredProperties.transform.translateY ? startProperties.transform.translateY : desiredProperties.transform.translateY,
                    rotate : desiredProperties.transform.rotate || 0
                };
            }
            return {
                target : target,
                startProperties: startProperties,
                desiredProperties: desiredProperties
            };
        }
        function getAnimatables(targets, properties) {
            let animatedTargets = [];
            if (typeof targets === 'string') {
                let createdTargets = document.querySelectorAll(targets);
                for (let i = 0; i < createdTargets.length; i++) {
                    animatedTargets.push(createAnimatable(createdTargets[i], properties));
                }
            }
            else if (targets.length) {
                for (let i = 0; i < targets.length; i++) {
                    animatedTargets.push(createAnimatable(target[i], properties));
                }
            }
            else if (targets) {
                animatedTargets.push(createAnimatable(targets, properties));
            }
            return animatedTargets;
        }
        function getProperties(animatable) {
            let desiredPropertyValues = {};
            for (let property in animatable) {
                if (!livelyProperties.includes(property)) {
                    if (cssTransformProperties.includes(property)) {
                        if (!desiredPropertyValues.transform) {
                            desiredPropertyValues.transform = { };
                        }
                        desiredPropertyValues.transform[property] = animatable[property];
                    }
                    else if (cssColorProperties.includes(property)) {
                        desiredPropertyValues[property] = parseColor(animatable[property]);
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
                'default' : easings.default
            };
            if (typeof eases === 'function') {
                animationEases.default = eases;
            }
            else if (typeof eases === 'string') {
                animationEases.default = easings[eases];
            }
            else if (eases && eases.length) {
                for (let i = 0; i < eases.length; i++) {
                    for (let property in eases[i]) {
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
                animatables : getAnimatables(animateObj.targets, getProperties(animateObj)),
                eases : getEases(animateObj.eases),
                preserve : animateObj.preserve,
                onDone : animateObj.done,
                onUpdate : animateObj.update
            };
        };
        return factory;
    })();
    const animator = (() => {
        function tickCssTransform(currentTime, duration, animatable, tween) {
            let target = animatable.target;
            let desiredTransforms = animatable.desiredProperties.transform;
            let startingProperties = animatable.startProperties.transform;
            let currentMatrix = {};

            for (let property in desiredTransforms) {
                let startVal = startingProperties[property];
                let changeInVal = desiredTransforms[property] - startVal;
                if (currentTime >= duration) currentMatrix[property] = desiredTransforms[property];
                else currentMatrix[property] = tween(currentTime, startVal, changeInVal, duration);
            }

            setCssTransform(target, currentMatrix);
        }
        function tickCssColor(currentTime, duration, animatable, property, tween) {
            let target = animatable.target;
            let startColors = animatable.startProperties[property];
            let desiredColors = animatable.desiredProperties[property];
            let currentValue = {};
            for (let color in desiredColors) {
                let startColor = startColors[color];
                let changeInVal = desiredColors[color] - startColor;
                if (currentTime >= duration) currentValue[property] = desiredColors[color];
                else currentValue[color] = tween(currentTime, startColor, changeInVal, duration);
            }
            setRgbValue(target, property, currentValue);
        }
        function tickCssStyle(currentTime, duration, animatable, property, tween) {
            let unit = getCssUnit(animatable.target, property);
            let startValue = parseFloat(animatable.startProperties[property]);
            let currentValue;
            let desiredValue = animatable.desiredProperties[property];
            if (currentTime >= duration) currentValue = desiredValue;
            else currentValue = tween(currentTime, startValue, (desiredValue - startValue), duration);
            setCssValue(animatable.target, property, currentValue + unit);
        }
        function tickObject(currentTime, duration, animatable, property, tween) {
            let target = animatable.target;
            let startValue = animatable.startProperties[property];
            let currentValue;
            let desiredValue = animatable.desiredProperties[property];
            if (currentTime >= duration) currentValue = desiredValue;
            else currentValue = tween(currentTime, startValue, (desiredValue - startValue), duration);
            target[property] = currentValue;
        }
        function tick(currentTime, animation) {
            let duration = animation.duration;
            let finished = (currentTime >= duration);
            // Iterate through all animatables
            for (let i = 0; i < animation.animatables.length; i++) {
                let animatable = animation.animatables[i];
                let desiredProperties = animatable.desiredProperties;
                // Iterate through all properties to be animated in the animatable
                for (let property in desiredProperties) {
                    let tweenName = (animation.eases[property]) ? animation.eases[property] : 'default';
                    let tween = easings[tweenName];
                    if (isElement(animatable.target) && property === 'transform') {
                        tickCssTransform(currentTime, duration, animatable, tween);
                    }
                    else if (isElement(animatable.target) && cssColorProperties.includes(property)) {
                        tickCssColor(currentTime, duration, animatable, property, tween);
                    }
                    else if (isElement(animatable.target)) {
                        tickCssStyle(currentTime, duration, animatable, property, tween);
                    }
                    else if (isObject(animatable.target)) {
                        tickObject(currentTime, duration, animatable, property, tween);
                    }
                }
            }
            return finished;
        }
        return {
            tick : tick
        };
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

        let renderer = animator.tick;
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
            startTime = undefined;
            elapsedTime = undefined;
            isPaused = false;
        }
        function renderAnimations(elapsedTime) {
            for (let i = 0; i < queuedAnimations.length; i++) {
                if (queuedAnimations[i]) {
                    let finished = renderer(elapsedTime, queuedAnimations[i]);
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
                raf = requestAnimationFrame(tick);
            }
            else {
                cancelAnimationFrame(raf);
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