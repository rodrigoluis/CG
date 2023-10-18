import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import {initRenderer, 
        initDefaultSpotlight,
        onWindowResize} from "../libs/util/util.js";

let scene, renderer, camera, light; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0.0, 0.0, 5.0);
light = initDefaultSpotlight(scene, new THREE.Vector3(0.0, 0.0, 5.0) ); // Use default light

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Assets manager --------------------------------
let explosion = {
   // Properties ---------------------------------
   textures: [],
   numTextures: 20,
   show: false,
   texPlane: null,
   texIndex: 0,
   frameDrop: 2,      

   // Functions ----------------------------------
   play : function() {
      this.show = true;
   },

   build : function() {
      // Create texture plane
      this.texPlane = new THREE.Mesh(
         new THREE.PlaneGeometry(2.0, 2.0, 20, 20),
         new THREE.MeshLambertMaterial({color:"rgb(255,255,255)", side:THREE.DoubleSide, alphaTest: 0.5}) );
      scene.add(this.texPlane);           

      // Load Textures
      var textureLoader = new THREE.TextureLoader();
      for (let i = 1; i <= this.numTextures; i++) {
         this.textures.push(textureLoader.load("../assets/textures/explosion/" + i + ".png"));  
      }
   },   

   animate : function() {
      if(this.show)
      {
         this.texPlane.visible = true; 
         let index = this.texIndex / this.frameDrop;
         let skip = this.texIndex%this.frameDrop;
         if(!skip)
            this.texPlane.material.map = this.textures[index];         
         this.texIndex++;

         // Hide plane after passing by all textures
         if(index > this.numTextures) 
         {
            this.texPlane.visible = false;   
            this.texIndex = 0;
            this.show = false;            
         }
      }
   },
}

explosion.build(); // Build explosion object
explosion.show = true; // Execute on start

buildInterface();
render();

function buildInterface()
{
  // GUI interface
  var gui = new GUI();
  gui.add(explosion, 'play')
    .name("Play");  
  gui.add(explosion, 'frameDrop', 1, 5).step(1)
    .name("Frame Drop");  
}

function render()
{
   explosion.animate();
   requestAnimationFrame(render);
   renderer.render(scene, camera)
}