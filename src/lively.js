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
    let customEasings = {};

    function getFirstKey(obj) {
        for (let key in obj) {
            return key;
        }
    }
    // NEW CSS STUFF
    const livelyProperties = ['update', 'done', 'targets', 'eases', 'preserve', 'keyframes'];
    const cssTransformProperties = ['translateX', 'translateY', 'rotate', 'scaleX', 'scaleY', 'skewX', 'skewY'];
    const cssColorProperties = ['color', 'background-color', 'border-color', 'fill'];
    function isElement(object) {
        return (object instanceof Element);
    }
    function isObject(object) {
        return (object instanceof Object);
    }
    function getValue(target, property) {
        if (isElement(target) && cssTransformProperties.includes(property)) {
            return getCssTransform(target)[property];
        }
        else if (isElement(target) && cssColorProperties.includes(property)) {
            return getRgbValue(target, property);
        }
        if (isElement(target)){
            return getCssValue(target, property);
        }
        else {
            return target[property];
        }
    }
    function getUnit(target, property) {
        if (isElement(target)){
            return getCssUnit(target, property);
        }
        else if (isObject(target)) {
            return '';
        }
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
            for (let i = 0; i < matrixValues.length; i++) {
                matrixValues[i] = parseFloat(matrixValues[i]);
            }
            let angle = Math.atan2(matrixValues[1], matrixValues[2]),
                denom = Math.pow(matrixValues[0], 2) + Math.pow(matrixValues[1], 2),
                scaleX = Math.sqrt(denom),
                scaleY = (matrixValues[0] * matrixValues[3] - matrixValues[2] * matrixValues[1]) / scaleX,
                skewX = Math.atan2(matrixValues[0] * matrixValues[2] + matrixValues[1] * matrixValues[3], denom);

            return {
                scaleX : scaleX,
                skewX : skewX / Math.PI / 180,
                skewY : 0,
                scaleY : scaleY,
                translateX : matrixValues[4],
                translateY : matrixValues[5],
                rotate : angle / Math.PI / 180
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
                };
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
    function parsePercentage(percentage) {
        if (percentage.endsWith('%')) {
            return parseInt(percentage.replace('%', ''));
        }
    }
    // Animation related constants
    const animationFactory = (() => {
        let factory = {};
        function getEases(eases) {
            let animationEases = {
                'default' : easings.default
            };
            if (typeof eases === 'function') {
                animationEases.default = eases;
            }
            else if (typeof eases === 'string' && (eases in easings)) {
                animationEases.default = easings[eases];
            }
            else if (typeof eases === 'string' && (eases in customEasings)) {
                animationEases.default = customEasings[eases];
            }
            else if (eases && eases.length) {
                for (let i = 0; i < eases.length; i++) {
                    for (let property in eases[i]) {
                        if ((typeof eases[i][property] === 'string') && (eases[i][property] in easings) || (eases[i][property] in customEasings)) {
                            let easingName = eases[i][property];
                            animationEases[property] = easings[easingName] || customEasings[easingName];
                        }
                        break;
                    }
                }
            }
            return animationEases;
        }
        function createTarget(target, properties) {
            let startProperties = {};
            for (let i = 0; i < properties.length; i++) {
                let property = properties[i];
                if (isElement(target) && cssTransformProperties.includes(property)) {
                    startProperties.transform = getCssTransform(target);
                }
                else if (isElement(target) && cssColorProperties.includes(property)){
                    startProperties[property] = getRgbValue(target, property);
                }
                else if (isElement(target)) {
                    let cssValue = getCssValue(target, property);
                    let unit = getCssUnit(target,property);
                    if (unit !== '') startProperties[property] = parseFloat(cssValue.substring(0, cssValue.indexOf(unit)));
                    else startProperties[property] = parseFloat(cssValue);
                }
                else {
                    startProperties[property] = target[property];
                }
            }
            return {
                target : target,
                startProperties : startProperties
            };
        }
        function getTargets(animateObj, duration) {
            let targets = animateObj.targets;
            let animatedTargets = [];
            let properties = [];
            for (let property in animateObj) {
                if (!livelyProperties.includes(property)) {
                    properties.push(property);
                }
            }
            if (typeof targets === 'string') {
                let createdTargets = document.querySelectorAll(targets);
                for (let i = 0; i < createdTargets.length; i++) {
                    animatedTargets.push({
                        target : createdTargets[i],
                        keyframes : getKeyframes(animateObj, duration, createdTargets[i])
                    });
                }
            }
            else if (targets.length) {
                for (let i = 0; i < targets.length; i++) {
                    animatedTargets.push(createTarget(target[i], properties));
                }
            }
            else if (targets) {
                animatedTargets.push(createTarget(targets, properties));
            }
            return animatedTargets;
        }

        function getKeyframes(animateObj, duration, target) {
            let propertyKeyframes = {};
            for (let property in animateObj) {
                if (!livelyProperties.includes(property)) {
                    if (typeof animateObj[property] !== 'string' && animateObj[property].length) {
                        propertyKeyframes[property] = [];
                        for (let i = 0; i < animateObj[property].length; i++) {
                            let frame = animateObj[property][i];
                            let percentComplete = getFirstKey(frame);
                            let completeTime = parsePercentage(percentComplete) / 100;
                            let obj = {
                                startTime : undefined,
                                startValue : getValue(target, property),
                                endTime : completeTime * duration,
                                endValue : frame[percentComplete],
                                unit : getUnit(target, property)
                            };
                            propertyKeyframes[property].push(obj);
                            propertyKeyframes[property].sort(function (a, b) {
                                return a.startTime > b.startTime;
                            });
                        }
                        propertyKeyframes[property][0].startTime = 0;
                        for (let i = 1; i < propertyKeyframes[property].length; i++) {
                            propertyKeyframes[property][i].startTime = propertyKeyframes[property][i - 1].endTime;
                            propertyKeyframes[property][i].startValue = propertyKeyframes[property][i - 1].endValue;
                        }
                        let length = propertyKeyframes[property].length;
                        propertyKeyframes[property][length - 1].isLast = true;

                    }
                    else if (isObject(animateObj[property])) {
                        let frame = animateObj[property];
                        let percentComplete = getFirstKey(frame);
                        let completeTime = parsePercentage(percentComplete) / 100;
                        propertyKeyframes[property] = [];
                        let obj = {
                            startTime : 0,
                            startValue : getValue(target, property),
                            endTime : duration * completeTime,
                            endValue : frame[percentComplete],
                            unit : getUnit(target, property),
                            isLast : true
                        };
                        propertyKeyframes[property].push(obj);
                    }
                    else {
                        let value = animateObj[property];
                        let obj = {
                            startTime : 0,
                            startValue : getValue(target, property),
                            endTime : duration,
                            endValue : value,
                            unit : getUnit(target, property),
                            isLast : true
                        };
                        propertyKeyframes[property] = [];
                        propertyKeyframes[property].push(obj);
                    }
                }
            }
            return propertyKeyframes;
        }

        factory.createAnimation = (animateObj, durationMs) => {
            return {
                duration : durationMs,
                eases : getEases(animateObj.eases),
                targets : getTargets(animateObj, durationMs),
                preserve : animateObj.preserve,
                onDone : animateObj.done,
                onUpdate : animateObj.update
            };
        };
        return factory;
    })();
    const animator = (() => {
        function getTween(eases, property) {
            return (eases[property] ? eases[property] : eases['default']);
        }
        function getKeyframe(currentTime, propertyKeyframes) {
            let length = propertyKeyframes.length;
            let keyframe = propertyKeyframes.filter(function (keyframe) {
                return currentTime >= keyframe.startTime && currentTime <= keyframe.endTime;
            })[0];
            if (keyframe) return keyframe;
            else return propertyKeyframes[length - 1];
        }
        function tick(currentTime, animation) {
            let duration = animation.duration;
            let finished = (currentTime >= duration);
            let eases = animation.eases;
            for (let i = 0; i < animation.targets.length; i++) {
                let target = animation.targets[i].target;
                let keyframeProperties = animation.targets[i].keyframes;

                for (let property in keyframeProperties) {
                    let tween = getTween(eases, property);
                    let keyframe = getKeyframe(currentTime, keyframeProperties[property]);
                    let keyframeFinished = keyframe.isLast && currentTime >= keyframe.endTime;
                    if (isElement(target)) {
                        if (keyframeFinished) {
                            setCssValue(target, property, keyframe.endValue + keyframe.unit);
                        }
                        else {
                            let startVal = parseFloat(keyframe.startValue);
                            let endVal = keyframe.endValue;
                            let currentVal = tween((currentTime - keyframe.startTime), startVal, (endVal - startVal), (keyframe.endTime - keyframe.startTime));
                            setCssValue(target, property, currentVal + keyframe.unit);
                        }
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
            raf = 0;
            if (finishedAnimations.length) {
                queuedAnimations = [].concat(finishedAnimations);
                finishedAnimations = [];
            }
        }
        function reset() {
            startTime = undefined;
            elapsedTime = undefined;
            isPaused = false;
            raf = 0;
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
    lively.easings = customEasings;
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