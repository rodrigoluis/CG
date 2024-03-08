import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { initRenderer, 
         initDefaultBasicLight,
         initCamera,
         createGroundPlane,
         onWindowResize} from "../libs/util/util.js";

//-- Ball Class -----------------------------------------------------------
class Ball {
   constructor() {
      this.speed = 0.1;
      this.moveOn = false;
      this.direction = new THREE.Vector3(0.7, 0.0, 0.4).normalize();
      this.object = this.buildGeometry()
      scene.add( this.object );    
   }
   getSpeed(){
      return this.speed;
   }
   setSpeed(speed){
      this.speed = speed;
   }
   startMoving(move){
      this.moveOn = move;
   }
   move(){
      if(!this.moveOn) return;
      let step = this.direction.clone().multiplyScalar(this.speed);    
      this.object.position.add(step);
      
      this.checkCollisions();
   }
   checkCollisions(){
      // Aqui pode-se incluir critérios de colisão mais sofisticados. 
      // Neste exemplo mais simples o controle é feito analisando as fronteiras do plano
      let size = 4.5;
      if(this.object.position.x >  size) this.changeDirection(new THREE.Vector3(-1.0,  0.0,  0.0));
      if(this.object.position.x < -size) this.changeDirection(new THREE.Vector3( 1.0,  0.0,  0.0));      
      if(this.object.position.z >  size) this.changeDirection(new THREE.Vector3( 0.0,  0.0, -1.0));
      if(this.object.position.z < -size) this.changeDirection(new THREE.Vector3( 0.0,  0.0,  1.0));         
   }
   changeDirection(normal) {
      this.direction.reflect(normal).normalize();
   }
   setDirection(direction){
      this.direction = direction.normalize();
   }  
   buildGeometry(){
      let obj = new THREE.Mesh(new THREE.SphereGeometry( 0.5, 32, 32 ), 
                               new THREE.MeshPhongMaterial({color:"red", shininess:"200"}));
         obj.position.set(0, 0.5, 0);
         obj.castShadow = true;
      return obj;      
   }
}

//-- Variables and settings -------------------------------------------------
let scene, renderer, camera, light, orbit;
scene    = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // View function in util/utils
camera   = initCamera(new THREE.Vector3(0, 13.0, 0)); // Init camera in this position
light    = initDefaultBasicLight(scene, true, new THREE.Vector3(3, 3, 1)); 
orbit    = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
let groundPlane = createGroundPlane(10, 10, 40, 40); // width, height, resolutionW, resolutionH
    groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
    groundPlane.position.y = -0.01;
scene.add(groundPlane);
scene.add( new THREE.AxesHelper( 12 ) );


let initialDirection = new THREE.Vector3(0.7, 0.0, 0.4);
let ball = new Ball();

buildInterface();
render();

//-- Functions -------------------------------------------------------
function buildInterface()
{
   let controls = new function () {
      this.move = false;
      this.speed = ball.getSpeed();
      this.onMove = function () {
         ball.setDirection(initialDirection);
         ball.startMoving(this.move);
      }  
      this.changeSpeed = function () {
         ball.setSpeed(this.speed);
      }        
   } 
   let gui = new GUI();
   let folder = gui.addFolder("Direction");
      folder.open();
      folder.add(initialDirection, 'x', -1, 1).onChange().name("Direction X");
      folder.add(initialDirection, 'z', -1, 1).onChange().name("Direction Y");
      gui.add(controls, "speed", 0.0, 0.5)
         .name("Speed")
         .onChange(function(e) { controls.changeSpeed() }); 
      gui.add(controls, "move", true)
         .name("Move")
         .onChange(function(e) { controls.onMove() });    
}

function render()
{
   ball.move(); 
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}