import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js';
import { SpriteMixer } from '../libs/sprites/SpriteMixer.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
   initRenderer,
   initCamera,
   initDefaultBasicLight,
   setDefaultMaterial,
   onWindowResize,
   InfoBox,
   createGroundPlaneXZ
} from "../libs/util/util.js";

let scene, renderer, camera, material, light, orbit; // Initial variables
let clock, delta, keyboard;
let spriteMixer, actionSprite = null, running, lastRunning, shooting = false, shootingFlag, actions = {};
let dead = false; // Flag to control the die action
let parallelMovement = true; // Variable to control parallel movement

scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
camera = initCamera(new THREE.Vector3(0, 7, 15)); // Init camera in this position
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
scene.add(camera); // Add camera to the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.
clock = new THREE.Timer();
keyboard = new KeyboardState();

let DOWN = 0, LEFT = 1, UP = 2, RIGHT = 3; // Directions
let key = [0, 0, 0, 0]; // Array to control movement in 4 directions (DOWN, LEFT, UP, RIGHT)

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper(12);
scene.add(axesHelper);
let axesHelperSprite = new THREE.AxesHelper(1);
axesHelperSprite.visible = false; // Hide sprite axes by default

// create the ground plane
let plane = createGroundPlaneXZ(20, 20, true)
scene.add(plane);

//-------------------------------------------------------------------
//  SPRITEMIXER RELATED CODE
//-------------------------------------------------------------------

/// ACTIONSPRITE AND ACTIONS INSTANTIATION
spriteMixer = SpriteMixer();

// Make sure to use the texture once it's fully loaded, by
// passing a callback function to the loader.
let loader = new THREE.TextureLoader();
let texture = loader.load("../assets/textures/sprites/zombieman.png", (texture) => {

   // An ActionSprite is instantiated with these arguments :
   // - which THREE.Texture to use
   // - the number of columns in your animation
   // - the number of rows in your animation
   actionSprite = spriteMixer.ActionSprite(texture, 8, 8);
   actionSprite.add(axesHelperSprite);
   actionSprite.position.y = 0.9; // Adjust the height of the sprite
   actionSprite.setFrame(0,0); // set initial frame of the sprite

   // - which actionSprite to use
   // - duration of ONE FRAME in the animation, in milliseconds
   // - line and column of the beginning of the action
   // - line and column of the end of the action
   actions.runDown  = spriteMixer.Action(actionSprite, 100, 0, 0, 3, 0);
   actions.runLD    = spriteMixer.Action(actionSprite, 100, 0, 1, 3, 1); // Left Down
   actions.runLeft  = spriteMixer.Action(actionSprite, 100, 0, 2, 3, 2);
   actions.runLU    = spriteMixer.Action(actionSprite, 100, 0, 3, 3, 3); // Left Up
   actions.runUp    = spriteMixer.Action(actionSprite, 100, 0, 4, 3, 4);
   actions.runRU    = spriteMixer.Action(actionSprite, 100, 0, 5, 3, 5); // Right Up    
   actions.runRight = spriteMixer.Action(actionSprite, 100, 0, 6, 3, 6);
   actions.runRD    = spriteMixer.Action(actionSprite, 100, 0, 7, 3, 7); // Right Down     

   actions.Die = spriteMixer.Action(actionSprite, 150, 7, 0, 7, 3); // Die action

   actions.ShootingDown  = spriteMixer.Action(actionSprite, 100, 4, 0, 5, 0);
   actions.ShootingLD    = spriteMixer.Action(actionSprite, 100, 4, 1, 5, 1);
   actions.ShootingLeft  = spriteMixer.Action(actionSprite, 100, 4, 2, 5, 2);
   actions.ShootingLU    = spriteMixer.Action(actionSprite, 100, 4, 3, 5, 3);
   actions.ShootingUp    = spriteMixer.Action(actionSprite, 100, 4, 4, 5, 4);
   actions.ShootingRU    = spriteMixer.Action(actionSprite, 100, 4, 5, 5, 5);
   actions.ShootingRight = spriteMixer.Action(actionSprite, 100, 4, 6, 5, 6);
   actions.ShootingRD    = spriteMixer.Action(actionSprite, 100, 4, 7, 5, 7);    

   actionSprite.scale.set(2, 2, 2);
   scene.add(actionSprite);
});
texture.colorSpace = THREE.SRGBColorSpace; // Fix sprite color space 

showInformation();
render();

function render() {
   keyboardUpdate();
   spriteUpdate();

   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}

// Update sprite position 
function spriteUpdate() {
   clock.update();
   delta = clock.getDelta();
   spriteMixer.update(delta);
   let speed = 0.05; // Speed of the sprite movement
   let hspeed = 0.04; // Diagonal speed of the sprite movement

   if (running == 'right') actionSprite.translateX(speed);
   if (running == 'left')  actionSprite.translateX(-speed);
   if (running == 'down')  actionSprite.translateZ(speed);
   if (running == 'up')    actionSprite.translateZ(-speed);

   if (running == 'ld'){
      actionSprite.translateX(-hspeed);
      actionSprite.translateZ(hspeed);
   } 

   if (running == 'lu'){
      actionSprite.translateX(-hspeed);
      actionSprite.translateZ(-hspeed);
   } 

   if (running == 'ru'){
      actionSprite.translateX(hspeed);
      actionSprite.translateZ(-hspeed);
   } 

   if (running == 'rd'){
      actionSprite.translateX(hspeed);
      actionSprite.translateZ(hspeed);
   } 

   // Rotate the action sprite local axes to face the camera
   if (actionSprite) {
      if(parallelMovement)
      {
         const euler = new THREE.Euler(); // Converter o quaternion da câmera para Euler
         euler.setFromQuaternion(camera.quaternion, 'YXZ'); // Acerta ordem da transformação    
         actionSprite.rotation.y = euler.y; // Copia rotação para o sprite para mantê-lo perpendicular à camera
      }else{
         actionSprite.rotation.y = 0;
      }
   }
}   

// Reset the isInLoop flags for all actions       
// Key array (DOWN, LEFT, UP, RIGHT)
function resetIsInLoopFlags(key) 
{
   if(actions.runDown  && !key[0]) actions.runDown.isInLoop = false;   
   if(actions.runLeft  && !key[1]) actions.runLeft.isInLoop = false;
   if(actions.runUp    && !key[2]) actions.runUp.isInLoop = false;      
   if(actions.runRight && !key[3]) actions.runRight.isInLoop = false;   

   if(actions.runLD && !key[1] && !key[0]) actions.runLD.isInLoop = false;    
   if(actions.runLU && !key[1] && !key[2]) actions.runLU.isInLoop = false;   
   if(actions.runRD && !key[3] && !key[0]) actions.runRD.isInLoop = false;    
   if(actions.runRU && !key[3] && !key[2]) actions.runRU.isInLoop = false;   
}

function keyboardUpdate() {
   keyboard.update();
   if (keyboard.down("A")) axesHelperSprite.visible = !axesHelperSprite.visible; // Toggle axes visibility
   if (keyboard.down("P")) parallelMovement = !parallelMovement; // Toggle parallel movement
   if (keyboard.down("R"))
   { 
      dead = false; // Reset the dead flag when 'R' is pressed
      actionSprite.setFrame(0,0); // Default frame if no other action is running
   }

   if (dead) return;

   if(keyboard.down("delete") && !dead) 
   {
      dead = true; // Set die flag to true
      actions.Die.playOnce(true);
      console.log("Die action triggered");
      return;
   }

   if ( keyboard.down("down"))  key[DOWN] = 1;      
   if ( keyboard.down("left"))  key[LEFT] = 1;         
   if ( keyboard.down("up"))    key[UP] = 1;      
   if ( keyboard.down("right")) key[RIGHT] = 1;         

   // Control shooting with space key
   if ( keyboard.down("space")) {
      shooting = true;
      shootingFlag = false; // Set shooting flag to false initially
   }else if ( keyboard.up("space")) {
      shooting = false;
      shootingFlag = true; // Reset shooting flag
   }

   if(key[LEFT]) { // If LEFT is pressed
      if(!key[DOWN] && !key[UP]) { // Only left pressed
         lastRunning = running = 'left'; // Set running direction to left
         if (!actions.runLeft.isInLoop) actions.runLeft.playLoop(); 
      } else if(key[DOWN] && !key[UP]) { 
         lastRunning = running = 'ld';         
         if (!actions.runLD.isInLoop) actions.runLD.playLoop();          
      }  else if(!key[DOWN] && key[UP]) {
         lastRunning = running = 'lu';         
         if (!actions.runLU.isInLoop) actions.runLU.playLoop();          
      } 
   }

   if(key[RIGHT] && !key[LEFT]) { 
      if(!key[DOWN] && !key[UP]) { 
         lastRunning = running = 'right'; 
         if (!actions.runRight.isInLoop) actions.runRight.playLoop(); 
      } else if(key[DOWN] && !key[UP]) { 
         lastRunning = running = 'rd';         
         if (!actions.runRD.isInLoop) actions.runRD.playLoop();          

      }  else if(!key[DOWN] && key[UP]) {
         lastRunning = running = 'ru';         
         if (!actions.runRU.isInLoop) actions.runRU.playLoop();          
      } 
   }  
   
   if(!key[RIGHT] && !key[LEFT]) { // Finally, check if only UP or DOWN is pressed
      if(key[UP]) { // Only left pressed
         lastRunning = running = 'up'; // Set running direction to up
         if (!actions.runUp.isInLoop) actions.runUp.playLoop(); 
      } else if(key[DOWN]) { 
         lastRunning = running = 'down'; // Set running direction to down
         if (!actions.runDown.isInLoop) actions.runDown.playLoop(); 
      } 
   }  
   
   if ( keyboard.up("down"))  key[0] = 0;      
   if ( keyboard.up("left"))  key[1] = 0;         
   if ( keyboard.up("up"))    key[2] = 0;      
   if ( keyboard.up("right")) key[3] = 0;   
   resetIsInLoopFlags(key); // Reset the isInLoop flags for all actions       

   // play shooting action of if the sprite is not running
   if( running == undefined) {      
      if(shooting){
         if(shootingFlag == false) { 
            if (lastRunning == 'down')  actions.ShootingDown.playLoop();
            if (lastRunning == 'ld')    actions.ShootingLD.playLoop();
            if (lastRunning == 'left')  actions.ShootingLeft.playLoop();         
            if (lastRunning == 'lu')    actions.ShootingLU.playLoop();
            if (lastRunning == 'up')    actions.ShootingUp.playLoop();      
            if (lastRunning == 'ru')    actions.ShootingRU.playLoop();            
            if (lastRunning == 'right') actions.ShootingRight.playLoop();      
            if (lastRunning == 'rd')    actions.ShootingRD.playLoop();            
         }
         shootingFlag = true;
      }
      else{
         // If no movement or shooting is detected , set the sprite to a default frame
         if (lastRunning == 'down')  actionSprite.setFrame(4, 0);
         if (lastRunning == 'ld')    actionSprite.setFrame(4, 1);      
         if (lastRunning == 'left')  actionSprite.setFrame(4, 2);
         if (lastRunning == 'lu')    actionSprite.setFrame(4, 3);      
         if (lastRunning == 'up')    actionSprite.setFrame(4, 4);      
         if (lastRunning == 'ru')    actionSprite.setFrame(4, 5);            
         if (lastRunning == 'right') actionSprite.setFrame(4, 6);      
         if (lastRunning == 'rd')    actionSprite.setFrame(4, 7);            
      }
   }
   if(!key[0] && !key[1] && !key[2] && !key[3]) running = undefined
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Sprite Example");
    controls.addParagraph();
    controls.add("Press 'A' to toggle Sprite's Axis Helper");
    controls.add("Press 'P' to set/unset paralell sprite movements");    
    controls.add("Press 'space' to simulate shooting");        
    controls.add("Press 'delete' to trigger dead animation");            
    controls.add("Press 'R' to reset the sprite"); 
    controls.add("Press arrow keys to move the sprite");
    controls.show();
}