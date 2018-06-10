# LivelyJS
A flexible JavaScript animation library for simple to complex animations.

## Build Status
[<img src="https://covenent.visualstudio.com/_apis/public/build/definitions/0d1bc4fd-677d-4e8a-8eaa-37c4fe18e311/5/badge"/>]

# Welcome to LivelyJS!
## About the library:
This library provides a means to easily and seamlessly add animation on to your web based project. 
**Why the name lively?** Because animation on your web app makes the entire experience more enjoyable and adds life to your web app.
**Who is this library for?** :
 - Anyone who wants a light wait method to add animation to thier project when css just cant cut it.
 - Anyone who wants to add animation as simply as possible.

**Features**:
 - Can animate css styling such as `border-radius`, `width`, `height`, `opacity` etc.
 - Can animate css translates which includes: `rotate`, `translateX`, `translateY`, `scaleX`, `scaleY`, `skewX`, `skewY` . 

## New in in v2.1.0: 
 - Animating color
 - Adding custom easing functions
 - Have easing per property.

 

## Installation:
run the command `bower install livelyjs` 
## Usage:
HTML:

    <script src="bower_components/livelyjs/src/lively.js"></script> 
    ...
    <div id="myDiv" style="opacity : 1; width: 100px; height: 100px; background: red;"></div>
    ...
 
    
Javascript:

       window.onload = function (ev) {  
	        lively.animate({  
	             targets : '#myDiv',  
			     translateX : 50,  
			     translateY : 50,  
			     'opacity' : .5,  
			     'border-radius' : 50,  
			     scaleX : 0.5,  
			     scaleY : 0.5,  
			     preserve : true,  
			     eases : 'easeInOutQuad'  
			     }, 
		     100);  
	     
	      function startAnimation() {  
	            lively.play();  
	      }  
    };

And voila! You should see an animation where the object moves, scales down and turns into a circle!

## The basics:
**Adding animations**: 
In order to add animations you must call:

> lively.animate(animateObj, duration)
> 
This function takes an animateObj and duration as parameters
animateObj looks like this:

    {
	    // these are the things that are being animated
	    targets: '', // this can be a nodelist, string for query selector or JSON obj
	    // these are the properties of the target we are animating
	    translateX : 50
	    border-radius: 50,
	    width : 20 
    }

## Playing animations:
Use the `lively.play()`function to start an animation. 
This will play all animateObjs that you have included. For example :

    lively.animate(animateObj1, 200);
    lively.animate(animateObj2, 1000);
    lively.play(); // this will start both of the included animations.

## Pausing animations: 
Use the `lively.pause()` function to pause **all** animations
## Stoping animations:
Use the `lively.stop()` function to pause **all** animation.

## Preserve
When livelyjs runs animation from `lively.play()`, after the completion of an animation the provided animateObj will automatically discarded, which means that if you clicked play again, nothing would happen! Preserving the animateObj will ensure that after your animation has completed that invoking `play()` again will restart the animation.
`preserve` : this is used to prevent livelyjs from discarding the animateObj after the animation has completed being run.

## Easings

`eases` : this is used to specify what easing function is being used during the animation. Currently there are 4 build in easing functions: 
 - `"default"` A basic linear ease
 - `"easeInQuad"`
 - `"easeOutQuad"`
 - `"easeInOutQuad"`

Example of using eases  using build in easing functions:
    
    targets: "myDiv"
    translateX : 50
    border-radius: 50,
    width : 20 
    eases : "easeInOutQuad"
        
Example of using eases to specify custom easing using a function:
    
    targets: "myDiv"
    translateX : 50
    border-radius: 50,
    width : 20 
    eases : function(currentTime, initialValue, changeInValue, duration) { }

Example of using eases to specify easing for  properties:
    
    targets: "myDiv"
    translateX : 50
    border-radius: 50,
    width : 20 
    eases : [{ width : 'easeInOutQuad' }, { border-radius : 'easeInQuad'}]
