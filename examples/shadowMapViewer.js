import * as THREE from  'three';
import KeyboardState from '../libs/util/KeyboardState.js';
import { TrackballControls } from '../build/jsm/controls/TrackballControls.js';
import { TeapotGeometry } from '../build/jsm/geometries/TeapotGeometry.js';
import { ShadowMapViewer } from '../build/jsm/utils/ShadowMapViewer.js';
import {initRenderer, 
        InfoBox,  
        SecondaryBox,        
        createGroundPlane,
        onWindowResize, 
        createLightSphere} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(80, 70, 170)");   

// Sphere to represent the light
var lightPosition = new THREE.Vector3(3.5, 3.5, 4.3);
var lightSphere = createLightSphere(scene, 0.03, 10, 10, lightPosition);
var light = initLight(lightPosition); // local function

// To use the keyboard
var keyboard = new KeyboardState();
var infoBox = new SecondaryBox("");

// Main camera
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(3.6, 4.6, 8.2);
  camera.up.set( 0, 1, 0 );

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement );

// Create the Shadow Map Viewer
var dirLightShadowMapViewer = new ShadowMapViewer( light );
  dirLightShadowMapViewer.size.set( 256, 256 );	//width, height  default: 256, 256
  dirLightShadowMapViewer.position.set( 10, 10 );	//x, y in pixel	 default: 0, 0 (top left corner)

// Listen window size changes
window.addEventListener( 'resize', function(){
  onWindowResize(camera, renderer);
  dirLightShadowMapViewer.updateForWindowResize();
}, false );

var groundPlane = createGroundPlane(10, 10, 40, 40); // width, height, resolutionW, resolutionH
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Create objects
createTeapot( 2.0,  0.5,  0.0, Math.random() * 0xffffff);
createTeapot(0.0,  0.5,  2.0, Math.random() * 0xffffff);  
createTeapot(0.0,  0.5, -2.0, Math.random() * 0xffffff);    

showInformation();
render();

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Shadow Map Viewer");
    controls.addParagraph();
    controls.add("Use the WASD-QE keys to move the light");
    controls.show();
}

// Update light position of the current light
function updateLightPosition()
{
  light.position.copy(lightPosition);
  lightSphere.position.copy(lightPosition);
  infoBox.changeMessage("Light Position: " + lightPosition.x.toFixed(2) + ", " +
                         lightPosition.y.toFixed(2) + ", " + lightPosition.z.toFixed(2));
}

function keyboardUpdate()
{
  keyboard.update();
  if ( keyboard.pressed("D") )
  {
    lightPosition.x += 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("A") )
  {
    lightPosition.x -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("W") )
  {
    lightPosition.y += 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("S") )
  {
    lightPosition.y -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("E") )
  {
    lightPosition.z -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("Q") )
  {
    lightPosition.z += 0.05;
    updateLightPosition();
  }
}

export function initLight(position) 
{
  const ambientLight = new THREE.HemisphereLight(
    'white', // bright sky color
    'darkslategrey', // dim ground color
    0.5, // intensity
  );

  const mainLight = new THREE.DirectionalLight('white', 0.7);
    mainLight.position.copy(position);
    mainLight.castShadow = true;
   
  const shadow = mainLight.shadow;
    shadow.mapSize.width  =  512; 
    shadow.mapSize.height =  512; 
    shadow.camera.near    =  0.1; 
    shadow.camera.far     =  50; 
    shadow.camera.left    = -8.0; 
    shadow.camera.right   =  8.0; 
    shadow.camera.bottom  = -8.0; 
    shadow.camera.top     =  8.0; 

  scene.add(ambientLight);
  scene.add(mainLight);

  return mainLight;
}

function createTeapot(x, y, z, color )
{
  var geometry = new TeapotGeometry(0.5);
  var material = new THREE.MeshPhongMaterial({color, shininess:"200"});
    material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;
    obj.position.set(x, y, z);
  scene.add(obj);
}

function render()
{
  trackballControls.update();
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  dirLightShadowMapViewer.render( renderer );  
}