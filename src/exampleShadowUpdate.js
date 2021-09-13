import * as THREE from  '../build/three.module.js';
import Stats from '../build/jsm/libs/stats.module.js';
import { FlyControls } from '../build/jsm/controls/FlyControls.js';
import { GUI } from       '../build/jsm/libs/dat.gui.module.js';
import {initRenderer,
        degreesToRadians,
        onWindowResize, 
        InfoBox,
        createGroundPlane} from "../libs/util/util.js";

//---------------------------------------------------------------------------------------
const scene = new THREE.Scene();    
const clock = new THREE.Clock();

const container = document.getElementById( 'container' );
const stats = new Stats();
container.appendChild( stats.dom );

const renderer = initRenderer();
  renderer.setClearColor("cornflowerblue");

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0.0, 25.0, 70.0);
  camera.up.set( 0, 1, 0 );
  camera.lookAt(new THREE.Vector3( 0.0, 4.0, 0.0 ));

window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

const flyCamera = new FlyControls( camera, renderer.domElement );
  flyCamera.movementSpeed = 20;
  flyCamera.rollSpeed = 0.20;
  flyCamera.dragToLook = true; // Do not move if not dragging.

// Globals
let firstRendering = true, time = 0, delta = 0, centerTorusAngle = 0;
let staticLight, dynamicLight, spotHelper, centerTorus;
let initialDynamicLightPos = new THREE.Vector3(10, 20, 10);
let torusInitialHeight = 3.2;

// Main functions
setLights();
setEnvironment();
showInformation();
buildInterface();
render();

//---------------------------------------------------------------------------------------
//-- FUNCTIONS --------------------------------------------------------------------------
//---------------------------------------------------------------------------------------
function setLights() 
{ 
  /* 
    Main directional light. 
    This light will be used to light and drop shadow of the static objects. The
    'autoupdate' parameter of this light must be set to false after the first rendering
    to increase performance (look at this inside de 'render' function)
    You can observe the large size of the shadow map and the size of the orthographic camera used. 
    You can create more than one directional light to cover bigger enviroments. 
  	As we create two lights, the intensity of each light is cut by half (i.e., 0.5 for each light).
  */
  staticLight = new THREE.DirectionalLight(0xffffff);
    staticLight.intensity = 0.5; // Intensity cut by half because we will create a second light in the same direction
    // Despite being only one direction (could be a unit vector), the shadow projection depends on 
    // the position of the orthographic camera used to control the extent of its projection
    staticLight.position.copy(new THREE.Vector3(100, 200, 100)); // 
    staticLight.shadow.mapSize.width = 4092;
    staticLight.shadow.mapSize.height = 4092;
    staticLight.shadow.camera.left = -400;
    staticLight.shadow.camera.right = 400;
    staticLight.shadow.camera.top = 400;
    staticLight.shadow.camera.bottom = -400;
    staticLight.castShadow = true;    
  scene.add(staticLight);

  /* 
    Dynamic directional light
    You can create a smaller directional light to be used to drop shadow on 
    dynamic objects. This light must "follow" the object (a car, person or a plane 
    for example) to drop the shadow accordingly. This light must be 
    positioned in the same direction of the main light to keep shadow's coherence.
    As mentioned before, the intensity of this light is cut by half and despite of its position
    it lights all objects. The shadow is computed only inside the shadow's camera area.
  */
  dynamicLight = new THREE.DirectionalLight(0xffffff);
    dynamicLight.intensity = 0.5; // No need to iluminate, just used to drop shadow.
    dynamicLight.position.set(initialDynamicLightPos.x, initialDynamicLightPos.y, initialDynamicLightPos.z);
    dynamicLight.shadow.mapSize.width = 256;
    dynamicLight.shadow.mapSize.height = 256;
    dynamicLight.castShadow = true;
    dynamicLight.shadow.camera.left = -7;
    dynamicLight.shadow.camera.right = 7;
    dynamicLight.shadow.camera.top = 7;
    dynamicLight.shadow.camera.bottom = -7;

  // Create helper for the dynamicLight
  spotHelper = new THREE.CameraHelper(dynamicLight.shadow.camera, 0xFF8C00);
    scene.add(spotHelper); 
    
  // Ambient light
  let ambientLight = new THREE.AmbientLight("rgb(80,80,80)");
    scene.add(ambientLight);    
}


function setEnvironment()
{
  // Ground plane
  const groundPlane = createGroundPlane(400, 400, 80, 80, "rgb(60, 30, 150)"); 
    groundPlane.rotateX(degreesToRadians(-90));
  scene.add(groundPlane);

  // Objects grid
  const geometry = new THREE.TorusKnotGeometry( 2.0, 0.5, 80, 80 );
  let objectStep = 10; // Use values between 10 (high density) or 20 (low density) to chance number of objects
  let material;
  for(let j = -190; j < 190; j+=objectStep)   
  { 
    material = new THREE.MeshPhongMaterial({shininess:"200"});    
    material.color.set(Math.random() * 0xffffff);
    for(let i = -190; i < 190; i+=objectStep)  
    {
      // Avoid the creation of object where the animation will appear
      let r = 10;
      if(i>=-r && i<=r && j>=-r && j<=r)
        continue;
      const obj = new THREE.Mesh( geometry, material );
      obj.castShadow = true;  
      obj.receiveShadow = true;        
      obj.position.set(i, torusInitialHeight, j);  
      scene.add( obj );  
    }
  }

  // Center object that will receive an animation
  centerTorus = new THREE.Mesh( geometry, material );
    centerTorus.castShadow = true;  
    centerTorus.receiveShadow = true;  
    centerTorus.position.set(0, torusInitialHeight, 0);  
}

function showInformation()
{  
  var controls = new InfoBox();
    controls.add("Movement controls");
    controls.addParagraph();
    controls.add("Keyboard:");            
    controls.add("* WASD - Move");
    controls.add("* R | F - up | down");
    controls.add("* Q | E - roll");
    controls.addParagraph();    
    controls.add("Keyboard arrows and mouse:");            
    controls.add("* up | down    - pitch");        
    controls.add("* left | right - yaw");
    controls.add("--Click and drag to use mouse.");
    controls.show();
}

function rotateCenterTorus()
{
  time+=delta/20;  
  if(centerTorusAngle == 360) centerTorusAngle = 0;
   centerTorusAngle += .1;
   centerTorus.rotateX(degreesToRadians(time));
}

function moveLightAndTarget() 
{
  dynamicLight.shadow.camera.updateProjectionMatrix();     

  centerTorus.position.set(dynamicLight.position.x-initialDynamicLightPos.x,
                           dynamicLight.position.y-initialDynamicLightPos.y+torusInitialHeight,
                           dynamicLight.position.z-initialDynamicLightPos.z);
  
  dynamicLight.target.position.set( centerTorus.position.x,
                                    centerTorus.position.y-torusInitialHeight,
                                    centerTorus.position.z);   
  dynamicLight.target.updateMatrixWorld();

  spotHelper.update();  
}



function buildInterface()
{
  function makeXYZGUI(gui, vector3, name, onChangeFn) {
    const folder = gui.addFolder(name);
    folder.add(vector3, 'x', -30, 30, 0.1).onChange(onChangeFn);
    folder.add(vector3, 'y',  20, 50, 0.1).onChange(onChangeFn);    
    folder.add(vector3, 'z', -30, 30, 0.1).onChange(onChangeFn);
    folder.open();
  }    

  const gui = new GUI();

  const staticFolder = gui.addFolder("Static Directional Light (main) ");
  staticFolder.open();  
  staticFolder.add(staticLight.shadow, 'autoUpdate', false).listen(); 
  staticFolder.add(staticLight, 'castShadow', true)
    .name("View Shadow");  
  //----------------------------------------------------
  const spotFolder = gui.addFolder("Dynamic Directional Light (secondary)");
  spotFolder.open();  
  spotFolder.add(dynamicLight.shadow, 'autoUpdate', true);
  spotFolder.add(spotHelper, 'visible', true)
    .name("Helper");    

  makeXYZGUI(spotFolder, dynamicLight.position, 'Object/Light Position', moveLightAndTarget);
}

function render()
{
  stats.update();
  delta = clock.getDelta();
  flyCamera.update(delta);

  rotateCenterTorus();

  requestAnimationFrame(render);
  renderer.render(scene, camera);

  // Add dynamic objects and light to the scene
  // Also change the 'autoUpdate' parameter of the staticLight to false.
  if(firstRendering)
  {
    staticLight.shadow.autoUpdate = false;
    scene.add( centerTorus );
    scene.add( dynamicLight );    
    firstRendering = false;
  }
}
