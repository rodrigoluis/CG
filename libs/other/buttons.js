 /*******************
  Buttons  
  Rodrigo L. S. Silva
  Dez/2021
  -------------------
  Usage:

  * In HTML's head load buttons.css
    <link rel="stylesheet" href="../libs/other/buttons.css"> 
  
  * In HTML's body create button's
    <button style="bottom:20px; right: 120px;" id="A" class="video-game-button">A</button>
    <button style="bottom:20px; right: 20px;" id="B" class="video-game-button">B</button>        
    <button style="top:10px; right: 10px; width: 1emp; line-height: 1.4em; font-size: 10pt; background-color: #cccccc; background-image:none" id="full" class="video-game-button">[ ]</button>     

  * In JS, import Buttons and call buttons' constructor passing the callbacks for up and down actions
    import {Buttons} from "../libs/other/buttons.js";    
    var buttons = new Buttons(onButtonDown, onButtonUp);

 *******************/

class Buttons 
{    
    constructor(onButtonDown, onButtonUp)
    {
        this.buttons = document.getElementsByTagName("button");
 
        // Add listeners
        for (let i = 0; i < this.buttons.length; i++) 
        {
            this.buttons[i].addEventListener("mousedown", onButtonDown, false);
            this.buttons[i].addEventListener("touchstart", onButtonDown, false);
            this.buttons[i].addEventListener("mouseup", onButtonUp, false);      
            this.buttons[i].addEventListener("touchend", onButtonUp, false); 
         }  
        return this;
    };

    setFullScreen()
    {
        if (!document.fullscreenElement && !document.mozFullScreenElement && 
            !document.webkitFullscreenElement && !document.msFullscreenElement ) {
            if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();                            
                //document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);            
            } else if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
            }
        } else {
            if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
            }else if (document.exitFullscreen) {
            document.exitFullscreen();
            } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
            } 
        }      
    }
};

export { Buttons };