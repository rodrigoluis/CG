import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {initRenderer, 
        SecondaryBox,
        initDefaultBasicLight,
        createGroundPlane,
        onWindowResize, 
        getMaxSize} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit;        
scene = new THREE.Scene();    // Create main scene
light = initDefaultBasicLight(scene, true); // Use default light
renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(50, 50, 90)");
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(2.18, 1.62, 3.31);
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(4.0, 4.0, 80, 80); // width and height
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 3 );
  axesHelper.visible = false;
scene.add( axesHelper );

var infoBox = new SecondaryBox("");

//---------------------------------------------------------
// Create a javascript object to store the main asset
let asset = {
   object: null,
   loaded: false,
   bb: new THREE.Box3()
}
loadGLBFile(asset, '../assets/objects/jeep.glb', 1.0);
let assetHelper = createBBHelper(asset.bb, 'yellow')

// Create objects to collide
let sphere1 = createSphere(0.0, 0.2, 1.8);
let bbSphere1 = new THREE.Box3().setFromObject(sphere1);
let bbHelper1 = createBBHelper(bbSphere1, 'white')
scene.add(sphere1);

let sphere2 = createSphere(0.0, 0.2, -1.8);
let bbSphere2 = new THREE.Box3().setFromObject(sphere2);
let bbHelper2 = createBBHelper(bbSphere2, 'white')
scene.add(sphere2);

// Create car movement parameters
const lerpConfig = {
   destination: new THREE.Vector3(0.0, 0.0, 1.5),
   alpha: 0.01,
   move: true
}

render();

//-- Functions ----------------------------------------------------------------------------------------------

function createBBHelper(bb, color)
{
   // Create a bounding box helper
   let helper = new THREE.Box3Helper( bb, color );
   scene.add( helper );
   return helper;
}

function createSphere(x, y, z)
{
  let geometry = new THREE.SphereGeometry(0.2, 30, 30, 0, Math.PI * 2, 0, Math.PI);
  let objectMaterial
  
  if(z > 0) objectMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,20,20)", shininess:"200"});
  else      objectMaterial = new THREE.MeshPhongMaterial({color:"rgb(20,255,20)", shininess:"200"});

  var object = new THREE.Mesh(geometry, objectMaterial);
    object.castShadow = true;
    object.position.set(x, y, z);
  return object;
}

function loadGLBFile(asset, file, desiredScale)
{
  let loader = new GLTFLoader( );
  loader.load( file, function ( gltf ) {
    let obj = gltf.scene;
    obj.traverse( function ( child ) {
      if ( child.isMesh ) {
          child.castShadow = true;
      }
    });
    obj = normalizeAndRescale(obj, desiredScale);
    obj = fixPosition(obj);
    obj.updateMatrixWorld( true )
    scene.add ( obj );

    // Store loaded gltf in our js object
    asset.object = gltf.scene;
    }, null, null);
}

// Normalize scale and multiple by the newScale
function normalizeAndRescale(obj, newScale)
{
  var scale = getMaxSize(obj); // Available in 'utils.js'
  obj.scale.set(newScale * (1.0/scale),
                newScale * (1.0/scale),
                newScale * (1.0/scale));
  return obj;
}

function fixPosition(obj)
{
  // Fix position of the object over the ground plane
  var box = new THREE.Box3().setFromObject( obj );
  if(box.min.y > 0)
    obj.translateY(-box.min.y);
  else
    obj.translateY(-1*box.min.y);
  return obj;
}

function buildInterface()
{
   var controls = new function ()
   {
     this.bbhelpers = true;
      this.viewBBs = function(){
         assetHelper.visible = bbHelper1.visible = bbHelper2.visible = this.bbhelpers;
     };
   };

   if(asset.object && !asset.loaded)
   {
      asset.loaded = true; // Build interface only when asset is loaded
      // GUI interface
      var gui = new GUI();
      gui.add(axesHelper, 'visible', false).name("View Axes");
      gui.add(controls, "bbhelpers", true)
         .onChange(function() { controls.viewBBs() })      
         .name("BB Helpers")          
   }
}

function updateAsset()
{
   if(asset.loaded)
   {
      let vec = new THREE.Vector3()
      asset.object.position.lerp(lerpConfig.destination, lerpConfig.alpha);      
      asset.bb.getCenter(vec)
      // Create zigzag movement
      if(vec.z > 1.48)
         lerpConfig.destination = new THREE.Vector3(0.0, 0.0, -1.5)
      if(vec.z < -1.48)
         lerpConfig.destination = new THREE.Vector3(0.0, 0.0,  1.5)
      asset.bb.setFromObject(asset.object);
   }
}

function checkCollisions(object)
{
   let collision = asset.bb.intersectsBox(object);
   if(collision) infoBox.changeMessage("Collision detected");
}

function render()
{
   buildInterface();
   updateAsset();

   if(lerpConfig.move)
   {
      updateAsset();
      infoBox.changeMessage("No collision detected");
      checkCollisions(bbSphere2); 
      checkCollisions(bbSphere1);
   }

   requestAnimationFrame(render);
   renderer.render(scene, camera)
}
