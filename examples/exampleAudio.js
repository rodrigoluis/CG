import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import Stats from '../build/jsm/libs/stats.module.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js'
import { initCamera,
         initRenderer,
         initDefaultBasicLight,
         createGroundPlane,
         getMaxSize,
         onWindowResize} from "../libs/util/util.js";

let scene, renderer, camera, orbit, clock, stats; // Initial variables
scene = new THREE.Scene();    // Create main scene
clock = new THREE.Clock();
stats = new Stats();          // To show FPS information
initDefaultBasicLight(scene, true, new THREE.Vector3(2, 2, 1), 10, 1024); // Create a 

renderer = initRenderer("rgb(30, 30, 42)");
camera   = initCamera(new THREE.Vector3(2.8, 1.8, 4.0)); // Init camera in this position
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

//-- Globals ------------------------------------------------------------------------
var man = null;
var playAction = false;
var time = 0;
var mixer = new Array();

//-- Events --------------------------------------------------------------------------
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
window.addEventListener('click', function () {  
   let startMessage = document.getElementById('start-message');
   if (startMessage) startMessage.style.display = 'none';
   playSoundsFirstTime();
});
var groundPlane = createGroundPlane(6.5, 6.5, 60, 60, "rgb(100,140,90)");
groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

//----------------------------------------------------------------------------
//-- AUDIO STUFF -------------------------------------------------------------

//-------------------------------------------------------
// Create a listener and add it to que camera
var firstPlay = true;
var listener = new THREE.AudioListener();
camera.add(listener);

// instantiate a global audio loader
let audioLoader = new THREE.AudioLoader();

// create a audio source
const sound = new THREE.Audio(listener);
audioLoader.load('../assets/sounds/sampleMusic.mp3', function (buffer) {
   sound.setBuffer(buffer);
   sound.setLoop(true);
   sound.setVolume(0.3);
});

//-- Create windmill sound ---------------------------------------------------       
const windmillSound = new THREE.PositionalAudio(listener);
audioLoader.load('../assets/sounds/sampleSound.ogg', function (buffer) {
   windmillSound.setBuffer(buffer);
   windmillSound.setLoop(true);
}); // Will be added to the target object

//-- Create ball sound ---------------------------------------------------       
const ballSound = new THREE.Audio(listener);
audioLoader.load('../assets/sounds/bounce.mp3', function (buffer) {
   ballSound.setBuffer(buffer);
   ballSound.setLoop(false);
});

//-- END OF AUDIO STUFF -------------------------------------------------------

// Load animated files and other objects
loadGLBFile('../assets/objects/windmill.glb', true, windmillSound);
loadGLBFile('../assets/objects/walkingMan.glb', false);

// Load ball
const speed = 2.5, height = 0.8, offset = 0.5;
let basketSoundOn = true;
let ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 16),
   new THREE.MeshLambertMaterial({ map: new THREE.TextureLoader().load('../assets/textures/basket.png') }));
ball.castShadow = true;
ball.translateX(0.5);
ball.translateY(1.5);
scene.add(ball);

buildInterface();
render();

//-- Functions -------------------------------------------------------

function loadGLBFile(modelName, centerObject, sound = null) {
   var loader = new GLTFLoader();
   loader.load(modelName, function (gltf) {
      var obj = gltf.scene;
      obj.traverse(function (child) {
         if (child.isMesh) child.castShadow = true;
         if (child.material) child.material.side = THREE.DoubleSide;
      });

      // Only fix the position of the windmill
      if (centerObject) {
         obj = normalizeAndRescale(obj, 2);
         obj = fixPosition(obj);
         if (sound) obj.add(sound); // Add sound to windmill
      }
      else {
         man = obj;
         rotateMan(0);
      }
      scene.add(obj);

      // Create animationMixer and push it in the array of mixers
      var mixerLocal = new THREE.AnimationMixer(obj);
      mixerLocal.clipAction(gltf.animations[0]).play();
      mixer.push(mixerLocal);

      return obj;
   }, null, null);
}

// Normalize scale and multiple by the newScale
function normalizeAndRescale(obj, newScale) {
   var scale = getMaxSize(obj); // Available in 'utils.js'
   obj.scale.set(newScale * (1.0 / scale),
      newScale * (1.0 / scale),
      newScale * (1.0 / scale));
   return obj;
}

function fixPosition(obj) {
   // Fix position of the object over the ground plane
   var box = new THREE.Box3().setFromObject(obj);
   if (box.min.y > 0)
      obj.translateY(-box.min.y);
   else
      obj.translateY(-1 * box.min.y);
   return obj;
}

// Function to rotate the man around the center object
function rotateMan(delta) {
   if (man) {
      time += delta * 25;
      var mat4 = new THREE.Matrix4();
      var scale = 0.4;
      man.matrixAutoUpdate = false;
      man.matrix.identity();  // reset matrix
      man.matrix.multiply(mat4.makeRotationY(THREE.MathUtils.degToRad(-time)));
      man.matrix.multiply(mat4.makeTranslation(2.0, 0.0, 0.0));
      man.matrix.multiply(mat4.makeScale(scale, scale, scale));
   }
}

function playSoundsFirstTime()
{
   if (firstPlay) { // Execute only once
      playAction = true;
      sound.play();
      windmillSound.play();
      firstPlay = false;
   }   
}

function buildInterface() {
   // Interface
   var controls = new function () {
      this.playMusic = true;
      this.playWindmill = true;
      this.playBasket = true;
      this.onPlayMusic = function () {
         if (this.playMusic) sound.play();
         else                sound.pause();
      };
      this.onPlayWindmill = function () {
         if (this.playWindmill) windmillSound.play();
         else                   windmillSound.pause();
      };
      this.onPlayBasket = function () {
         basketSoundOn = this.playBasket ? true : false;
      };
   };
   let gui = new GUI();
   gui.add(controls, 'playMusic', true)
      .name("Music")
      .onChange(function (e) { controls.onPlayMusic() });
   gui.add(controls, 'playWindmill', true)
      .name("Windmill")
      .onChange(function (e) { controls.onPlayWindmill() });
   gui.add(controls, 'playBasket', true)
      .name("Basket")
      .onChange(function (e) { controls.onPlayBasket() });
}

function render() {
   stats.update();
   let delta = clock.getDelta();
   let time = clock.getElapsedTime();
   requestAnimationFrame(render);
   renderer.render(scene, camera);

   // Animation control
   if (playAction) {
      for (var i = 0; i < mixer.length; i++)
         mixer[i].update(delta);
      rotateMan(delta);
      let oldpos = ball.position.y;
      ball.position.y = 0.1 + Math.abs(Math.sin(i * offset + (time * speed)) * height);

      if (basketSoundOn && ball.position.y < 0.15 && ball.position.y > oldpos)
         ballSound.play();
   }
}