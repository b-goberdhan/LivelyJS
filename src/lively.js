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
    function parseValue(value) {
        let result = parseColor(value);
        if (result) return result;
        result = parseFloat(parseCssValue(value));
        if (result !== undefined && !isNaN(result)) return result;
        return value;
    }
    function parseCssValue(value) {
        if (typeof value !== 'string') return undefined;
        let x = value.replace(/[^0-9]/g, '');
        console.log(x);
        return x;
    }
    function parseColor(color) {
        if (typeof color !== 'string') return undefined;
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
    function parsePercentage(percentage) {
        if (percentage.endsWith('%')) {
            return parseInt(percentage.replace('%', ''));
        }
    }
    function parseUnit(target, property, value) {
        if (!isElement(target)) return undefined;
        else return parseCssUnit(target, property, value);
    }
    function parseCssUnit(element, property, value) {
        if (isElement(element) && cssColorProperties.includes(property)) return undefined;
        else if (isElement(element)) {
            let unit;
            if (typeof value === 'string') {
                unit = value.replace(/\d+/, '');
            }
            if (!isNaN(value) || unit === '') {
                let styleValue = getComputedStyle(element).getPropertyValue(property);
                unit = styleValue.replace(/\d+/, '');
            }
            if (unit === '') return undefined;
            else return unit;
        }
    }
    function getTargetValue(target, property) {
        if (isElement(target)) {
            return getCssValue(target, property);
        }
        return target[property];
    }
    function getCssValue(element, property) {
        if (isElement(element)) {
            return getComputedStyle(element).getPropertyValue(property);
        }
    }
    function setTargetPropertyValue(target, property, value) {
        if (isElement(target) && cssColorProperties.includes(property)) {
            setRgbValue(target, property, value);
        }
        else if (isElement(target)) {
            target.style[property] = value;
        }
        else if (isObject(target)) {
            target[property] = value;
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
                    animatedTargets.push({
                        target : targets[i],
                        keyframes: getKeyframes(animateObj, duration, targets[i])
                    });
                }
            }
            else if (targets) {
                animatedTargets.push({
                    target : targets,
                    keyframes : getKeyframes(animateObj, duration, targets)
                });
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
                            let endTime = (parsePercentage(percentComplete) / 100) * duration;
                            let startVal = (i === 0) ? parseValue(getTargetValue(target, property)) : undefined;
                            propertyKeyframes[property].push({
                                startTime : undefined,
                                startValue : startVal,
                                endTime : endTime,
                                endValue : parseValue(frame[percentComplete]),
                                unit : parseUnit(target, property, frame[percentComplete]),
                            });
                            propertyKeyframes[property].sort(function (a, b) {
                                return a.startTime > b.startTime;
                            });
                        }
                        propertyKeyframes[property][0].startTime = 0;
                        // If we have multiple keyframes, we set the start time and start value
                        // of future keyframes to be the endTime and endValue of previous keyframes
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
                        let endTime = (parsePercentage(percentComplete) / 100) * duration;
                        propertyKeyframes[property] = [];
                        propertyKeyframes[property].push({
                            startTime : 0,
                            startValue : parseValue(getTargetValue(target, property)),
                            endTime : endTime,
                            endValue : parseValue(frame[percentComplete]),
                            unit : parseUnit(target, property, frame[percentComplete]),
                            isLast : true
                        });
                    }
                    else {
                        let value = animateObj[property];
                        propertyKeyframes[property] = [];
                        propertyKeyframes[property].push({
                            startTime : 0,
                            startValue : parseValue(getTargetValue(target, property)),
                            endTime : duration,
                            endValue : parseValue(value),
                            unit : parseUnit(target, property, value),
                            isLast : true
                        });
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
        function animateKeyframe(currentTime, target, property, keyframe, tween) {
            if (keyframe.isLast && currentTime >= keyframe.endTime) {
                return keyframe.endValue;
            }
            else if (isElement(target) && cssTransformProperties.includes(property)) {

            }
            else if (isElement(target) && cssColorProperties.includes(property)) {
                return {
                    r : tween((currentTime - keyframe.startTime), keyframe.startValue.r, (keyframe.endValue.r - keyframe.startValue.r), (keyframe.endTime - keyframe.startTime)),
                    g : tween((currentTime - keyframe.startTime), keyframe.startValue.g, (keyframe.endValue.g - keyframe.startValue.g), (keyframe.endTime - keyframe.startTime)),
                    b : tween((currentTime - keyframe.startTime), keyframe.startValue.b, (keyframe.endValue.b - keyframe.startValue.b), (keyframe.endTime - keyframe.startTime)),
                }
            }
            else if (isElement(target) || isObject(target)) {
                return tween((currentTime - keyframe.startTime), keyframe.startValue, (keyframe.endValue - keyframe.startValue), (keyframe.endTime - keyframe.startTime));
            }

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
                    let currentVal = animateKeyframe(currentTime, target, property, keyframe, tween);
                    if (keyframe.unit) setTargetPropertyValue(target, property, currentVal + keyframe.unit);
                    else setTargetPropertyValue(target, property, currentVal);
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