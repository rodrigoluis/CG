import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {initRenderer, 
        setBasicMaterial,
        SecondaryBox,
        initDefaultBasicLight,
        createGroundPlane,
        onWindowResize, 
        degreesToRadians, 
        createLightSphere} from "../libs/util/util.js";
import {loadLightPostScene} from "../libs/util/utilScenes.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

//initDefaultBasicLight(scene, true); // Use default light

 

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(5, 5, 5);
  camera.up.set( 0, 1, 0 );


// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 3 );
  axesHelper.visible = false;
scene.add( axesHelper );

let dirPosition = new THREE.Vector3(2, 2, 4)
const dirLight = new THREE.DirectionalLight('white', 0.2);
dirLight.position.copy(dirPosition);
 //mainLight.castShadow = true;
scene.add(dirLight);  

//---------------------------------------------------------
// Default light intensity, position, color, ambient color and intensity
let lightPosition = new THREE.Vector3(1.5, 3.0, 0.0);
let lightTarget = new THREE.Vector3(2.5, 0.0, 0.0);
let lightColor = "rgb(255,255,255)";
let ambientColor = "rgb(50,50,50)";

let ambientLight = new THREE.AmbientLight(ambientColor);
ambientLight.intensity = .7;
scene.add( ambientLight );

let spotLight = new THREE.SpotLight(lightColor);
setSpotLight(lightPosition, lightTarget);

// Create helper for the spotlight
const spotHelper = new THREE.SpotLightHelper(spotLight, 0xFF8C00);
//scene.add(spotHelper);

// Sphere to represent the light
let lightSphere = createLightSphere(scene, 0.05, 10, 10, lightPosition);

//---------------------------------------------------------
// Load external objects
loadLightPostScene(scene)
buildInterface();

let mat1 = setBasicMaterial("rgb(255, 20, 20)");
let mat2 = setBasicMaterial("rgb( 20,255, 20)");
let mat3 = setBasicMaterial("rgb(255, 20,255)");
let mat4 = setBasicMaterial("rgb(255,255, 20)");
//var objectMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,20,20)", shininess:"200"});
// Add objects to scene
let cube = createCube(mat1, 0.5);
cube.position.set(3.0, 0.5, 0.0) 
scene.add(cube);

let cube2 = createCube(mat2, 0.5);
cube2.position.set(3.0, 0.5, 2.0) 
scene.add(cube2);

let cylinder = createCylinder(mat3, .2, .2, 1.0, 20, 4);
cylinder.position.set(0.0, 0.5, 3.0) 
scene.add(cylinder);

let cylinder2 = createCylinder(mat4, .2, .2, 1.0, 20, 4);
cylinder2.position.set(1.5, 0.5, -1.5) 
scene.add(cylinder2);

render();


function createCylinder(mat, radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)
{
  var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
  var object = new THREE.Mesh(geometry, mat);
    object.castShadow = true;
    object.position.set(0.0, height/2.0, 0.0);
  return object;
}

function createCube(mat, s)
{
  var geometry = new THREE.BoxGeometry(s, s*2, s);
  var object = new THREE.Mesh(geometry, mat);
    object.castShadow = true;
    object.position.set(0.0, s/2.0, 0.0);
  return object;
}



// Set Spotlight
// More info here: https://threejs.org/docs/#api/en/lights/SpotLight
function setSpotLight(position, target)
{
  spotLight.position.copy(position);
  spotLight.target.position.copy(target);
  spotLight.target.updateMatrixWorld();

  //spotLight.target.set(10, 0, 0);
  spotLight.angle = degreesToRadians(45); 
  spotLight.intensity = 0.6;   
  spotLight.decay = 2; // The amount the light dims along the distance of the light.
  spotLight.penumbra = 0.5; // Percent of the spotlight cone that is attenuated due to penumbra. 

    // Shadow settings
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 512;
  spotLight.shadow.mapSize.height = 512;
  spotLight.name = "Spot Light"

  scene.add(spotLight);
}


function makeXYZGUI(gui, vector3, name, onChangeFn) {
   const folder = gui.addFolder(name);
   folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
   folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
   folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
   folder.open();
}    


 function updateLight() {
   spotLight.target.updateMatrixWorld();
   lightSphere.position.copy(spotLight.position);
   spotLight.shadow.camera.updateProjectionMatrix();     
   spotHelper.update();
   //shadowHelper.update();    
 }

function buildInterface()
{
  // GUI interface
  var gui = new GUI();
  gui.add(axesHelper, 'visible', false).name("View Axes");  
  gui.add(ambientLight, 'visible', true).name("Ambient Light");  
  gui.add(dirLight, 'visible', true).name("Directional Light");  
  gui.add(spotLight, 'visible', true).name("Spot Light");  

  let spotFolder = gui.addFolder("SpotLight Parameters");
    spotFolder.open();     
    makeXYZGUI(spotFolder, spotLight.position, 'position', updateLight);
    makeXYZGUI(spotFolder, spotLight.target.position, 'target', updateLight);     
}

function render()
{
  stats.update();
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
