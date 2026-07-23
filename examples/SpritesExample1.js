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
let spriteMixer, actionSprite = null, running, lastRunning, runningZ, actions = {};
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
loader.load("../assets/textures/sprites/fox.png", (texture) => {

   // An ActionSprite is instantiated with these arguments :
   // - which THREE.Texture to use
   // - the number of columns in your animation
   // - the number of rows in your animation
   actionSprite = spriteMixer.ActionSprite(texture, 10, 2);   
   actionSprite.add(axesHelperSprite);
   actionSprite.position.y = 0.65; // Adjust the height of the sprite
   actionSprite.castShadow = true; // Enable shadow for this sprite
   actionSprite.setFrame(0,9); // set initial frame of the sprite

   // Two actions are created with these arguments :
   // - which actionSprite to use
   // - duration of ONE FRAME in the animation, in milliseconds
   // - line and column of the beginning of the action
   // - line and column of the end of the action
   actions.runLeft  = spriteMixer.Action(actionSprite, 40, 1, 0, 1, 8);
   actions.runRight = spriteMixer.Action(actionSprite, 40, 0, 0, 0, 8);

   actionSprite.scale.set(1.7, 2, 1);
   scene.add(actionSprite);
});

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

   if (running == 'right')     actionSprite.translateX(0.05);
   else if (running == 'left') actionSprite.translateX(-0.05);

   if (runningZ == 'up')        actionSprite.translateZ(-0.05);
   else if (runningZ == 'down') actionSprite.translateZ(0.05);

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
   if(actions.runLeft  && !key[1]) actions.runLeft.isInLoop = false;
   if(actions.runRight && !key[3]) actions.runRight.isInLoop = false;   
}

function keyboardUpdate() {
   keyboard.update();

   if (keyboard.down("A")) axesHelperSprite.visible = !axesHelperSprite.visible; // Toggle axes visibility
   if (keyboard.down("P")) parallelMovement = !parallelMovement; // Toggle parallel movement

   if ( keyboard.down("down"))  key[DOWN] = 1;      
   if ( keyboard.down("left"))  key[LEFT] = 1;         
   if ( keyboard.down("up"))    key[UP] = 1;      
   if ( keyboard.down("right")) key[RIGHT] = 1; 

   if(key[LEFT]) { // If LEFT is pressed
      lastRunning = running = 'left'; // Set running direction to left
      if (!actions.runLeft.isInLoop) actions.runLeft.playLoop(); 
   }

   if(key[RIGHT]) { 
      lastRunning = running = 'right'; 
      if (!actions.runRight.isInLoop) actions.runRight.playLoop(); 
   }  

   if (key[UP]) {
      if (runningZ != 'up') {
         // Se o último movimento foi para a esquerda, continua com a animação para este lado
         if (lastRunning == 'left') 
            actions.runLeft.playLoop();
         else
            actions.runRight.playLoop();
         runningZ = 'up';
      }
   };

   if (key[DOWN]) {
      if (runningZ != 'down') {
         // Se o último movimento foi para a esquerda, continua com a animação para este lado
         if (lastRunning == 'left') 
            actions.runLeft.playLoop();
         else
            actions.runRight.playLoop();
         runningZ = 'down';
      }
   };

   // Atualiza o vetor up, que controla se o sprite está se movendo para os lados ou para cima/baixo
   if (keyboard.up("down"))  key[DOWN] = 0;
   if (keyboard.up("left"))  key[LEFT] = 0;
   if (keyboard.up("up"))    key[UP] = 0;
   if (keyboard.up("right")) key[RIGHT] = 0;
   resetIsInLoopFlags(key); // Reset the isInLoop flags for all actions       

   // Atualiza as variáveis de movimento
   if(!key[LEFT] && !key[RIGHT]) running  = undefined
   if(!key[DOWN] && !key[UP])    runningZ = undefined   

   if( running == undefined && runningZ == undefined && actionSprite ) {
      (lastRunning == 'left') ? actionSprite.setFrame(1, 9) : actionSprite.setFrame(0, 9);
   }
}

function showInformation()
{
  // Use this to show information onscreen
   var controls = new InfoBox();
      controls.add("Sprite Example");
      controls.addParagraph();
      controls.add("Press 'A' to toggle Sprite's Axis Helper");
      controls.add("Press 'P' to set/unset paralell sprite movements");    
      controls.add("Press arrow keys to move the sprite");
      controls.show();
}