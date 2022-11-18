import * as THREE from 'three';
import { initDefaultBasicLight,
         SecondaryBox} from "../libs/util/util.js";
import { ARjs } from '../libs/AR/ar.js';
import { TeapotGeometry } from '../build/jsm/geometries/TeapotGeometry.js';
import {
   initAR,
   createSourceChangerInterface
} from "../libs/util/utilAR.js"
import ARMultimarkerManager from "../libs/util/ARMultimarkerManager.js"


let scene, camera, renderer, light;
renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.shadowMap.enabled = true;
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
renderer.setSize(1280, 960); // Change here to render in low resolution (for example 640 x 480)
document.body.appendChild(renderer.domElement);
scene = new THREE.Scene();
camera = new THREE.Camera();
scene.add(camera);
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

var markerMessage = new SecondaryBox("");
markerMessage.changeStyle("rgba(0,0,0,0)", "yellow", "20px", "ubuntu")

// Build maker relation table passing the id and {x, y, z} position of the virtual object
let markers = new ARMultimarkerManager();
let actualMarker;
markers.add(0, 2.5, 0.0, 1.25); // A
markers.add(1, 0.0, 0.0, 1.25); // B
markers.add(2, -2.5, 0.0, 1.25); // C
markers.add(3, 2.5, 0.0, -1.25); // D
markers.add(4, 0.0, 0.0, -1.25); // G
markers.add(5, -2.5, 0.0, -1.25); // F


// Set AR Stuff
let AR = {
   source: null,
   context: null,
}
initAR(AR, renderer);
setARStuff();
createSourceChangerInterface('../assets/AR/multiScene.jpg', '../assets/AR/multiScene.webm', 'webcam')

render();

function render() {
   updateAR();
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}

function updateAR() {
   if (AR.source.ready === false) return
   AR.context.update(AR.source.domElement)

   // print current marker being used.
   actualMarker = markers.changeVisibility(AR)
   printMarker(actualMarker);
}
function printMarker(m)
{
   let markers = ["A", "B", "C", "D", "G", "F"];
   if(m>=0 && m<=5) 
   {
      markerMessage.changeMessage("Reference Marker: " + markers[m]);  
      return;
   }
   markerMessage.changeMessage("");
}

function setARStuff() {
   //----------------------------------------------------------------------------
   // initialize arToolkitContext
   AR.context = new ARjs.Context({
      cameraParametersUrl: '../libs/AR/data/camera_para.dat',
      detectionMode: 'mono',
   })

   // initialize it
   AR.context.init(function onCompleted() {
      // copy projection matrix to camera
      camera.projectionMatrix.copy(AR.context.getProjectionMatrix());
   })

   //----------------------------------------------------------------------------
   // Create a ArMarkerControls
   let patternArray = ["a", "b", "c", "d", "g", "f"];
   for (let i = 0; i < 6; i++) {
      let markerObject = buildObject(i)      
      new ARjs.MarkerControls(AR.context, markerObject, {
         type: 'pattern',
         patternUrl: "../libs/AR/data/multi/patt." + patternArray[i],
      });
   }
}

function buildObject(i)
{
   // Set virtual object
   let side = 1.5;
   let mesh = createTeapot(side);    

   // Fix position depending on the marker that is visible
   let virtualObjectPosition = markers.get(i); // Get marker's object relative position
   mesh.position.x = virtualObjectPosition.x;
   mesh.position.y = virtualObjectPosition.y + side; // fix the height of the virtual object
   mesh.position.z = virtualObjectPosition.z;

   // ARjs.MarkerControls expect an Object3D object
   let markerObject = new THREE.Object3D();
       markerObject.add(mesh);   
   scene.add(markerObject);   
   return markerObject;
}

function createTeapot(size) {
   var textureLoader = new THREE.TextureLoader();
   var glass = textureLoader.load('../assets/textures/granite.png');
   glass.mapping = THREE.EquirectangularReflectionMapping; // Reflection as default
   glass.encoding = THREE.sRGBEncoding;

   var obj = new THREE.Mesh(
      new TeapotGeometry(size),
      new THREE.MeshLambertMaterial(
         { color: "rgb(255,255,255)", 
           envMap: glass, 
           refractionRatio: 0.95, 
           side: THREE.DoubleSide,
           transparent: true,
           opacity: 0.7 })   
   );
   return obj;
}

function createTeapot2(size) {
   let obj = new THREE.Mesh(
      new TeapotGeometry(size),
      new THREE.MeshLambertMaterial(
         { color: "rgb(255,0,0)" })   
   );
   return obj;
}
