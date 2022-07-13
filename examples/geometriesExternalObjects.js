import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from '../build/jsm/loaders/OBJLoader.js';
import {PLYLoader} from '../build/jsm/loaders/PLYLoader.js';
import {MTLLoader} from '../build/jsm/loaders/MTLLoader.js';
import {initRenderer, 
        initDefaultBasicLight,
        createGroundPlane,
        onWindowResize, 
        getMaxSize,
        degreesToRadians} from "../libs/util/util.js";

let scene, renderer, camera, orbit, light;
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // View function in util/utils
   renderer.setClearColor("rgb(30, 30, 42)");
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.lookAt(0, 0, 0);
   camera.position.set(2.18, 1.62, 3.31);
   camera.up.set( 0, 1, 0 );
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.
light = initDefaultBasicLight(scene, true); // Use default light

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(5.0, 5.0, 100, 100); // width and height
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 3 );
  axesHelper.visible = false;
scene.add( axesHelper );

//---------------------------------------------------------
// Load external objects
let assets = {
   dolphins: null,
   vase: null,
   flowers: null,
   toucan: null,
   cow: null,
   f16: null,
   ball: null
}

loadOBJFile('../assets/objects/', 'dolphins', true, 1.5);
loadOBJFile('../assets/objects/', 'rose+vase', false, 1.5);
loadOBJFile('../assets/objects/', 'flowers', false, 1.5);
loadGLBFile('../assets/objects/', 'TocoToucan', false, 2.0);
loadPLYFile('../assets/objects/', 'cow', false, 2.0);
loadOBJFile('../assets/objects/', 'f16', false, 2.2);
loadOBJFile('../assets/objects/', 'soccerball', false, 1.2);

buildInterface();
render();

function loadPLYFile(modelPath, modelName, visibility, desiredScale)
{
  var loader = new PLYLoader( );
  loader.load( modelPath + modelName + '.ply', function ( geometry ) {

    geometry.computeVertexNormals();

    var material = new THREE.MeshPhongMaterial({color:"rgb(255,120,50)"});
    var obj = new THREE.Mesh( geometry, material );

    obj.name = modelName;
    obj.visible = visibility;
    obj.castShadow = true;

    var obj = normalizeAndRescale(obj, desiredScale);
    var obj = fixPosition(obj);

    scene.add( obj );

    if(modelName == 'cow') assets.cow = obj;            
    }, onProgress, onError);
}

function loadGLBFile(modelPath, modelName, visibility, desiredScale)
{
  var loader = new GLTFLoader( );
  loader.load( modelPath + modelName + '.glb', function ( gltf ) {
    var obj = gltf.scene;
    obj.name = modelName;
    obj.visible = visibility;
    obj.traverse( function ( child ) {
      if ( child ) {
          child.castShadow = true;
      }
    });
    obj.traverse( function( node )
    {
      if( node.material ) node.material.side = THREE.DoubleSide;
    });

    var obj = normalizeAndRescale(obj, desiredScale);
    var obj = fixPosition(obj);

    scene.add ( obj );

    if(modelName == 'TocoToucan') assets.toucan = obj;            
    }, onProgress, onError);
}


function loadOBJFile(modelPath, modelName, visibility, desiredScale)
{
  var manager = new THREE.LoadingManager( );

  var mtlLoader = new MTLLoader( manager );
  mtlLoader.setPath( modelPath );
  mtlLoader.load( modelName + '.mtl', function ( materials ) {
      materials.preload();

      var objLoader = new OBJLoader( manager );
      objLoader.setMaterials(materials);
      objLoader.setPath(modelPath);
      objLoader.load( modelName + ".obj", function ( obj ) {
         obj.name = modelName;
         obj.visible = visibility;
         // Set 'castShadow' property for each children of the group
         obj.traverse( function (child)
         {
         child.castShadow = true;
         });

         obj.traverse( function( node )
         {
         if( node.material ) node.material.side = THREE.DoubleSide;
         });

         var obj = normalizeAndRescale(obj, desiredScale);
         var obj = fixPosition(obj);

         scene.add ( obj );
      
      if(modelName == 'dolphins')   assets.dolphins = obj;         
      if(modelName == 'rose+vase')  assets.vase = obj;         
      if(modelName == 'flowers')    assets.flowers = obj;         
      if(modelName == 'f16')        assets.f16 = obj;                                    
      if(modelName == 'soccerball') assets.ball = obj;

      }, onProgress, onError );
  });

}

function onError() { };

function onProgress ( xhr, model ) { }

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

function hideAllAssets()
{
   assets.dolphins.visible = assets.vase.visible = assets.flowers.visible = 
   assets.f16.visible = assets.ball.visible = 
   assets.toucan.visible = assets.cow.visible = false;
}

function buildInterface()
{
  // Interface
  var controls = new function ()
  {
    this.viewAxes = false;
    this.type = "Dolphins";
    this.onChooseObject = function()
    {
      hideAllAssets();
      if(this.type == 'Dolphins')   assets.dolphins.visible = true;
      if(this.type == 'Vase')       assets.vase.visible = true;      
      if(this.type == 'Flowers')    assets.flowers.visible = true;
      if(this.type == 'F16')        assets.f16.visible = true;      
      if(this.type == 'Soccerball') assets.ball.visible = true;
      if(this.type == 'TocoToucan') assets.toucan.visible = true;      
      if(this.type == 'Cow')        assets.cow.visible = true;

    };
    this.onViewAxes = function(){
       axesHelper.visible = this.viewAxes;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'type',
    ['Dolphins', 'Vase', 'Flowers', 'F16',
      'Soccerball', 'TocoToucan', 'Cow'])
    .name("Change Object")
    .onChange(function(e) { controls.onChooseObject(); });
  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });    
}

function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
