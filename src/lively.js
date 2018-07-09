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

    function stringContains(string, text) {
        return string.indexOf(text) > -1;
    }
    //Helpers
    const is = {
        dom: a => a instanceof Element,
        svg: a => a instanceof SVGElement,
        obj: a => stringContains(Object.prototype.toString.call(a), 'Object'),
        empty: a => Object.keys(a).length === 0 || (is.array(a) && a.length === 0),
        array: a => Array.isArray(a),
        nodeList : a => stringContains(Object.prototype.toString.call(a), 'NodeList'),
        str: a => typeof a === 'string',
        und: a => a === undefined,
        fnc: a => typeof a === 'function',
        rgb: a => /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.test(a),
        hex: a => /(^#[0-9a-f]{3}$)|(^#[0-9a-f]{6}$)/i.test(a),
        hex3: a => /(^#[0-9a-f]{3}$)/i.test(a),
        hex6: a => /(^#[0-9a-f]{6}$)/i.test(a),
        col : a => is.rgb(a) || is.hex(a)
    };

    function getFirstKey(obj) {
        for (let key in obj) { return key; }
    }
    const livelyProperties = ['update', 'done', 'targets', 'eases', 'preserve', 'keyframes'];
    const cssTransformProperties = ['transform', 'translateX', 'translateY', 'rotate', 'scaleX', 'scaleY', 'skewX', 'skewY'];
    const cssColorProperties = ['color', 'background-color', 'border-color', 'fill'];

    function parseValue(value, property) {
        if (is.col(value)) return parseColor(value);
        let result = parseTransform(value, property);
        if (!is.und(result) && !isNaN(result)) return result;
        result = parseFloat(parseCssValue(value));
        if (!is.und(result) && !isNaN(result)) return result;
        return value;
    }
    function parseCssValue(value) {
        if (!is.str(value)) return undefined;
        return value.replace(/[^0-9]/g, '');
    }
    function parseTransform(value, property) {
        if (!property || !cssTransformProperties.includes(property)) return undefined;
        let currentTransform = {};
        let match;
        let regex = /(\w+)\(([^)]*)\)/g;
        while ((match = regex.exec(value)) !== null) {
            let number = match[2].replace(/[^0-9]/g, '');
            if (number) currentTransform[match[1]] = parseFloat(number);
        }

        if (!currentTransform[property] && stringContains(property, 'scale')) return 1;
        else if (!currentTransform[property]) return 0;
        else return currentTransform[property];
    }
    function parseColor(color) {
        if (is.rgb(color)) {
            let rgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
            if (rgb) {
                return {
                    r : parseInt(rgb[1]),
                    g : parseInt(rgb[2]),
                    b : parseInt(rgb[3])
                };
            }
        }
        else if (is.hex3(color)) {
            let rgb = color.match(/^#([0-9a-f]{3})$/i)[1];
            if (rgb) {
                return {
                    r : parseInt(rgb.charAt(0), 16) * 0x11,
                    g : parseInt(rgb.charAt(1), 16) * 0x11,
                    b : parseInt(rgb.charAt(2), 16) * 0x11,
                };
            }
        }
        else if (is.hex6(color)) {
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

    function parsePercentage(str) {
        if (str.endsWith('%')) return parseFloat(str.replace('%', ''));
    }
    function parseUnit(target, property, value) {
        if (!is.dom(target)) return undefined;
        return parseCssUnit(target, property, value);
    }
    function parseCssUnit(element, property, value) {
        if (is.dom(element) && cssColorProperties.includes(property)) return undefined;
        else if (is.dom(element)) {
            if (stringContains(property, 'opacity') || stringContains(property, 'scale')) return undefined;
            let unit = /(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|px|pt|pc|deg)$/.exec(value);
            if (!unit && stringContains(property, 'rotate') || stringContains(property, 'skew')) return 'deg';
            if (!unit) return 'px';
            return unit[0];
        }
    }
    function getTargetValue(target, property) {
        if (is.dom(target)) {
            return getCssValue(target, property);
        }
        return target[property];
    }
    function getCssValue(element, property) {
        if (is.dom(element) && cssTransformProperties.includes(property)) {
            return element.style.transform;
        }
        else if (is.dom(element)) {
            return getComputedStyle(element).getPropertyValue(property);
        }
    }
    function setTargetPropertyValue(target, property, value) {
        if (is.dom(target) && cssTransformProperties.includes(property)) {
            setTransformValue(target, property, value);
        }
        else if (is.dom(target) && cssColorProperties.includes(property)) {
            setRgbValue(target, property, value);
        }
        else if (is.dom(target)) {
            target.style[property] = value;
        }
        else if (is.obj(target)) {
            target[property] = value;
        }
    }
    function setRgbValue(element, property, rgb) {
        if (is.dom(element)) {
            element.style[property] = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
        }
    }
    function setTransformValue(element, property, transform) {
        
        if (is.dom(element)) {

            let scaleX = !transform.scaleX ? '' : 'scaleX('+ transform.scaleX +') ';
            let skewY = !transform.skewY ? '' : 'skewY('+ transform.skewY +') ';
            let skewX = !transform.skewX ? '' : 'skewX('+ transform.skewX +') ';
            let scaleY = !transform.scaleY ? '' : 'scaleY('+ transform.scaleY +') ';
            let translateX = !transform.translateX ? '' : 'translateX('+ transform.translateX +') ';
            let translateY = !transform.translateY ? '' : 'translateY('+ transform.translateY +') ';
            let rotate = !transform.rotate ? '' : 'rotate('+ transform.rotate +') ';
            element.style.transform = translateX + translateY + scaleX + scaleY + rotate + skewY + skewX;
        }
    }
    // Animation related constants
    const animationFactory = (() => {
        let factory = {};
        function getEases(eases) {
            let animationEases = {
                'default' : easings.default
            };
            if (is.fnc(eases)) {
                animationEases.default = eases;
            }
            else if (is.str(eases) && (eases in easings)) {
                animationEases.default = easings[eases];
            }
            else if (is.str(eases) && (eases in customEasings)) {
                animationEases.default = customEasings[eases];
            }
            else if (is.array(eases)) {
                for (let i = 0; i < eases.length; i++) {
                    for (let property in eases[i]) {
                        if (is.str(eases[i][property]) && (eases[i][property] in easings) || (eases[i][property] in customEasings)) {
                            let easingName = eases[i][property];
                            animationEases[property] = easings[easingName] || customEasings[easingName];
                        }
                        break;
                    }
                }
            }
            return animationEases;
        }
        function getKeyframes(animatedProperties, duration, target) {
            let propertyKeyframes = {};
            for (let propertyName in animatedProperties) {
                let keyframes = [];
                let animatedProperty = animatedProperties[propertyName];

                if (!is.obj(animatedProperty) && !is.array(animatedProperty) && !is.nodeList(animatedProperty)) {
                    keyframes.push({
                        startTime : 0,
                        startValue : parseValue(getTargetValue(target, propertyName), propertyName),
                        endTime : duration,
                        endValue : parseValue(animatedProperty),
                        unit : parseUnit(target, propertyName, animatedProperty),
                        isLast : true
                    });
                }
                else {
                    if (is.obj(animatedProperty)) {
                        animatedProperty = [].concat(animatedProperty);
                    }
                    for (let i = 0; i < animatedProperty.length; i++) {

                        let key = getFirstKey(animatedProperty[i]);
                        let endTime = (parsePercentage(key) / 100) * duration;
                        keyframes.push({
                            startTime : 0,
                            startValue : parseValue(getTargetValue(target, propertyName), propertyName),
                            endTime : endTime,
                            endValue : parseValue(animatedProperty[i][key]),
                            unit : parseUnit(target, propertyName, animatedProperty[i][key]),
                            isLast : false
                        });
                    }
                    keyframes.sort((a, b) => {
                        return a.startTime > b.startTime;
                    });
                    keyframes[keyframes.length - 1].isLast = true;

                    for (let i = 1; i < keyframes.length; i++) {
                        keyframes[i].startTime = keyframes[i - 1].endTime;
                        keyframes[i].startValue = keyframes[i - 1].endValue;
                    }

                }
                propertyKeyframes[propertyName] = keyframes;

            }
            return propertyKeyframes;
        }
        function getTargets(animateObj, duration){
            let targets = animateObj.targets;
            let animatedTargets = [];
            let animatedProperties = {};

            for (let property in animateObj) {
                if (!livelyProperties.includes(property)) {
                    animatedProperties[property] = animateObj[property];
                }
            }

            if (is.str(targets)) {
                let createdTargets = document.querySelectorAll(targets);
                for (let i = 0; i < createdTargets.length; i++) {
                    animatedTargets.push({
                        target : createdTargets[i],
                        keyframes : getKeyframes(animatedProperties, duration, createdTargets[i])
                    });
                }
            }
            else if (is.array(targets) || is.nodeList(targets)) {
                for (let i = 0; i < targets.length; i++) {
                    animatedTargets.push({
                        target : targets[i],
                        keyframes: getKeyframes(animatedProperties, duration, targets[i])
                    });
                }
            }
            else if (is.obj(targets)) {
                animatedTargets.push({
                    target : targets,
                    keyframes : getKeyframes(animatedProperties, duration, targets)
                });
            }
            return animatedTargets;
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
            else if (is.dom(target) && cssColorProperties.includes(property)) {
                return {
                    r : tween((currentTime - keyframe.startTime), keyframe.startValue.r, (keyframe.endValue.r - keyframe.startValue.r), (keyframe.endTime - keyframe.startTime)),
                    g : tween((currentTime - keyframe.startTime), keyframe.startValue.g, (keyframe.endValue.g - keyframe.startValue.g), (keyframe.endTime - keyframe.startTime)),
                    b : tween((currentTime - keyframe.startTime), keyframe.startValue.b, (keyframe.endValue.b - keyframe.startValue.b), (keyframe.endTime - keyframe.startTime)),
                };
            }
            else if (is.dom(target) || is.obj(target)) {
                return tween((currentTime - keyframe.startTime), keyframe.startValue, (keyframe.endValue - keyframe.startValue), (keyframe.endTime - keyframe.startTime));
            }

        }
        function tick(currentTime, animation) {
            const duration = animation.duration;
            const finished = (currentTime >= duration) || (currentTime < 0);
            if (currentTime < 0) return finished;

            let eases = animation.eases;
            for (let i = 0; i < animation.targets.length; i++) {
                let target = animation.targets[i].target;
                let keyframeProperties = animation.targets[i].keyframes;

                let transform = {};
                for (let property in keyframeProperties) {
                    let tween = getTween(eases, property);
                    let keyframe = getKeyframe(currentTime, keyframeProperties[property]);
                    let currentVal = animateKeyframe(currentTime, target, property, keyframe, tween);
                    if (keyframe.unit) currentVal = currentVal + keyframe.unit;
                    if (cssTransformProperties.includes(property)) transform[property] = currentVal;
                    else setTargetPropertyValue(target, property, currentVal);
                }
                if (!is.empty(transform)) {
                    setTargetPropertyValue(target, 'transform', transform);
                }
            }
            return finished;
        }
        return {
            tick : tick
        };
    })();

    let queuedAnimations = [];
    let runningAnimations = [];
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
        let reverseTime = 0;
        let isPaused = false;
        let isRewinding = false;
        let isPlaying = false;
        let resolve;
        function play(res) {
            isRewinding = isPaused = false;
            resolve = res;
            runningAnimations = runningAnimations.concat(queuedAnimations);
            if (!isPlaying) {
                isPlaying = true;
                raf = requestAnimationFrame(tick);
            }
        }
        function rewind() {
            if (isPlaying) {
                isRewinding = true;
            }
        }
        function pause() {
            isPaused = true;
            isRewinding = false;
            isPlaying = false;
        }
        function stop() {
            isPlaying = false;
            isRewinding = false;
            startTime = undefined;
            elapsedTime = 0;
            pauseTime = 0;
            reverseTime = 0;
            raf = 0;
            if (finishedAnimations.length) {
                queuedAnimations = [].concat(finishedAnimations);
                finishedAnimations = [];
            }
            runningAnimations = [];
            if (resolve) {
                resolve();
            }
        }
        function reset() {
            startTime = undefined;
            elapsedTime = undefined;
            isPaused = false;
            isPlaying = false;
            resolve = undefined;
            raf = 0;
        }
        function renderAnimations(elapsedTime) {
            for (let i = 0; i < runningAnimations.length; i++) {
                if (runningAnimations[i]) {
                    let finished = renderer(elapsedTime, runningAnimations[i]);
                    if (runningAnimations[i].onUpdate && !isPaused) {
                        runningAnimations[i].onUpdate(runningAnimations[i].target);
                    }
                    
                    if (finished) {
                        if (runningAnimations[i].onDone) {
                            runningAnimations[i].onDone(runningAnimations[i].target);
                        }
                        if (runningAnimations[i].preserve) {
                            finishedAnimations.push(runningAnimations[i]);
                        }
                        runningAnimations.splice(i, 1);
                    }
                }
            }
        }
        function tick(timeStamp) {
            if (runningAnimations.length && isPlaying) {
                if (!startTime) {
                    startTime = timeStamp;
                }

                if (isPaused) {
                    pauseTime = (timeStamp - startTime) - elapsedTime;
                    elapsedTime = (timeStamp - startTime) - pauseTime; 
                }

                if (isRewinding) {
                    let currentTime = (timeStamp - startTime) - pauseTime;
                    reverseTime = (elapsedTime - (currentTime - elapsedTime));
                    renderAnimations(reverseTime);
                }
                else {
                    elapsedTime = (timeStamp - startTime) - pauseTime;
                    renderAnimations(elapsedTime - reverseTime);
                }

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
            rewind : rewind,
            pause : pause,
            stop : stop,
            reset : reset
        };
    })();

    lively.reset = () => {
        queuedAnimations = [];
        runningAnimations = [];
        finishedAnimations = [];
        animationEngine.reset();
    };
    lively.easings = customEasings;
    lively.animate = (animateObj, durationMs) => {
        let animation = animationFactory.createAnimation(animateObj, durationMs);
        queuedAnimations.push(animation);
    };

    lively.promise = {};
    lively.promise.play = () => {
        return new Promise((resolve, reject) => {
            try {
                animationEngine.play(resolve);
            }
            catch (e) {
                reject(e);
            }
        });
    };

    lively.play = () => animationEngine.play();
    lively.rewind = () => animationEngine.rewind();
    lively.pause = () => animationEngine.pause();
    lively.stop = () => animationEngine.stop();

    return lively;
}));