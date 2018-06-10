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
 - Coming soon in v2.2.0: Animating color.

 

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
 
