import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
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
  renderer.setClearColor("rgb(30, 30, 42)");
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.18, 1.62, 3.31);
  camera.up.set( 0, 1, 0 );
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

//---------------------------------------------------------
// Create a javascript object to store the asset
let asset = {
   object: null,
   loaded: false,
   bb: new THREE.Box3()
}
// Create a bounding box helper
let helper = new THREE.Box3Helper( asset.bb, 0xffff00 );
scene.add( helper );

loadGLBFile(asset, '../assets/objects/orca.glb', 3.0);

render();

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
   if(asset.object && !asset.loaded)
   {
      asset.loaded = true; // Build interface only when asset is loaded
      // GUI interface
      var gui = new GUI();
      gui.add(axesHelper, 'visible', false).name("View Axes");
      gui.add(asset.object, 'visible', true).name("Asset");    
   }
}

function updateAsset()
{
   if(asset.loaded)
   {
      asset.object.rotateY(-0.01)
      asset.bb.setFromObject(asset.object);
   }
}

function render()
{
   buildInterface()
   updateAsset();
   requestAnimationFrame(render);
   renderer.render(scene, camera)
}
