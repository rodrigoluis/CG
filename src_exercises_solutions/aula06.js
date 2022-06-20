// Setas para direita e esquerda movem as fontes de luzes
// Setas para cima e para baixo trocam as luzes
// Teclas 1, 2 e 3 ligam/desliga luzes

import * as THREE from  '../build/three.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import KeyboardState from '../libs/util/KeyboardState.js';

import {initRenderer, 
        createGroundPlane,      
        onWindowResize, 
        degreesToRadians,
        radiansToDegrees} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene

// To use the keyboard
var keyboard = new KeyboardState();

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("steelblue");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(4.6, 5.6, 9.2);
  camera.up.set( 0, 1, 0 );

const ambientLight = new THREE.HemisphereLight(
  'white', // bright sky color
  'darkslategrey', // dim ground color
  0.1, // intensity
);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight('white', .3);
  mainLight.position.set(1, 0, 0);
  mainLight.castShadow = false;
scene.add(mainLight);

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(18, 18, 100, 100); // width, height, resolutionW, resolutionH
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

let radius = 4;
let size = 0.08;
let teapotSize = 1.3;
// Create objects
createTeapot(teapotSize);

scene.add(createTorus(radius, size, 150, 150));

let rot = [0, 0, 0];
let op = 0;
let spot = [createSpot("rgb(255,0,0)", radius, radius+size, 0),
            createSpot("rgb(0,255,0)", radius, radius+size, 0),
            createSpot("rgb(0,0,255)", radius, radius+size, 0)];

scene.add(spot[0], spot[1], spot[2]);

render();

// Function to rotate the man around the center object
function rotateSpot(inc)
{
  var spot1 = spot[op];
  rot[op] += inc;

  var mat4 = new THREE.Matrix4();
  spot1.matrixAutoUpdate = false;
  spot1.matrix.identity();  // reset matrix
  spot1.matrix.multiply(mat4.makeRotationY(degreesToRadians(rot[op])));
  spot1.matrix.multiply(mat4.makeTranslation(radius, radius+size, 0));
}

function keyboardUpdate() {

  keyboard.update();
  if ( keyboard.pressed("right") ) rotateSpot(1);
  if ( keyboard.pressed("left") ) rotateSpot(-1);  
  if ( keyboard.down("up") )
  {
    op++;
    if(op==3) op = 0;
  } 
  if ( keyboard.down("down") )
  {
    op--;
    if(op==-1) op = 2;
  } 

  if ( keyboard.down("1") ) spot[0].visible = !spot[0].visible;
  if ( keyboard.down("2") ) spot[1].visible = !spot[1].visible;
  if ( keyboard.down("3") ) spot[2].visible = !spot[2].visible;    

}

function createSpot(color, x, y, z)
{
  //---------------------------------------------------------
  // Create and set the spotlight
  var spotLight = new THREE.SpotLight(color);
    spotLight.position.set(x, y, z);
    spotLight.intensity = 0.7;  
    spotLight.castShadow = true;
    spotLight.decay = 2;
    spotLight.penumbra = 1;
    spotLight.angle= degreesToRadians(40);
    // Shadow Parameters
    spotLight.shadow.mapSize.width = 512;
    spotLight.shadow.mapSize.height = 512;
    spotLight.shadow.camera.fov = radiansToDegrees(spotLight.angle);
    spotLight.shadow.camera.near = .2;    
    spotLight.shadow.camera.far = 20.0;        

    spotLight.add( lightSphere (color, 0.2 ));

    return spotLight;
}

function lightSphere(color, radius, x, y, z)
{
  var geometry = new THREE.SphereGeometry(radius, 10, 10, 0, Math.PI * 2, 0, Math.PI);
  var material = new THREE.MeshPhongMaterial(
    {color:color, 
    shininess:"300"});
  var object = new THREE.Mesh(geometry, material);
    object.visible = true;
  scene.add(object);

  return object;
}

function createTorus(radius, tube, radialSegments, tubularSegments)
{
  var geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
  var objectMaterial = new THREE.MeshPhongMaterial(
    {color:"red", 
    shininess:"100"});

  objectMaterial.emissive.set(0x222222);

  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(0.0, radius+tube, 0.0);
    object.rotateX(3.1415/2.0);
  return object;
}

function createTeapot(size)
{
  var geometry = new TeapotGeometry(size);
  var material = new THREE.MeshPhongMaterial({color:"white", shininess:"200"});
    material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;
    obj.position.set(0, size, 0);
  scene.add(obj);
}

function render()
{
  trackballControls.update();
  keyboardUpdate();  
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}