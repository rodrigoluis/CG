import * as THREE from  '../build/three.module.js';
import { FlyControls } from '../build/jsm/controls/FlyControls.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import Stats from '../build/jsm/libs/stats.module.js';
import KeyboardState from '../libs/util/KeyboardState.js';        
import {initRenderer,
        degreesToRadians,
        SecondaryBox,
        onWindowResize, 
        InfoBox,
        createGroundPlane} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
const clock = new THREE.Clock();

const container = document.getElementById( 'container' );
const stats = new Stats();
container.appendChild( stats.dom );

setLight();

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("cornflowerblue");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(10.0, 15.0, 0.0);
  camera.up.set( 0, 1, 0 );

// Details here:
// https://threejs.org/docs/index.html#examples/en/controls/FlyControls
var flyCamera = new FlyControls( camera, renderer.domElement );
  flyCamera.movementSpeed = 10;
  flyCamera.domElement = renderer.domElement;
  flyCamera.rollSpeed = 0.20;
  flyCamera.autoForward = false;
  flyCamera.dragToLook = false;

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(400, 400, 80, 80, "rgb(60, 30, 150)"); // width and height
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);


// To use the keyboard
var keyboard = new KeyboardState();

var autoUpdateBox = new SecondaryBox("");

addObjects();

showInformation();
render();


function setLight() 
{
  var position = new THREE.Vector3(100, 200, 200);

  var dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.copy(position);
  dirLight.shadow.mapSize.width = 4092;
  dirLight.shadow.mapSize.height = 4092;
  dirLight.castShadow = true;

  dirLight.shadow.camera.left = -400;
  dirLight.shadow.camera.right = 400;
  dirLight.shadow.camera.top = 400;
  dirLight.shadow.camera.bottom = -400;

  scene.add(dirLight);

  var ambientLight = new THREE.AmbientLight("rgb(80,80,80)");
  ambientLight.name = "ambientLight";
  scene.add(ambientLight);
}


function addObjects()
{
  var objColor = "rgb(255,20,20)";  
  const geometry = new THREE.TorusKnotGeometry( 2.0, 0.5, 80, 80 );

  let i, j;
  for(j = -190; j < 190; j+=10)   
  { 
    const material = new THREE.MeshPhongMaterial({shininess:"200"});    
      material.color.set(Math.random() * 0xffffff);
    for(i = -190; i < 190; i+=10)  
    {
      const obj = new THREE.Mesh( geometry, material );
        obj.castShadow = true;  
        obj.receiveShadow = true;  
        obj.position.set(i, 3.2, j);  
      scene.add( obj );  
    }
  }
}

function showInformation()
{  
  var controls = new InfoBox();
    controls.add("Shadow AUTOUPDATE");
    controls.addParagraph();
    controls.add("Press ENTER to turn ON/OFF");            
    controls.addParagraph();
    controls.addParagraph();    
    controls.add("Movement controls");
    controls.addParagraph();
    controls.add("Keyboard:");            
    controls.add("* WASD - Move");
    controls.add("* R | F - up | down");
    controls.add("* Q | E - roll");
    controls.addParagraph();    
    controls.add("Mouse and Keyboard arrows:");            
    controls.add("* up | down    - pitch");        
    controls.add("* left | right - yaw");
    controls.addParagraph();    
    controls.add("Mouse buttons:");            
    controls.add("* Left  - Move forward");        
    controls.add("* Right - Move backward");

    controls.show();
}

function keyboardUpdate() {

  keyboard.update();

  if ( keyboard.down("enter") )
  {
    if(renderer.shadowMap.autoUpdate)
    {
      renderer.shadowMap.autoUpdate = false;
      autoUpdateBox.changeMessage("AutoUpdate OFF");
    }
    else
    {
      renderer.shadowMap.autoUpdate = true;
      renderer.shadowMap.needsUpdate = true;
      autoUpdateBox.changeMessage("AutoUpdate ON");      
    }
  } 
}

function render()
{
  const delta = clock.getDelta();
  stats.update();
  flyCamera.update(delta);
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
