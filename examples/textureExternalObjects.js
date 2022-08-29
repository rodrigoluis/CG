import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from '../build/jsm/loaders/OBJLoader.js';
import {MTLLoader} from '../build/jsm/loaders/MTLLoader.js';
import {initRenderer, 
        initDefaultSpotlight,
        createGroundPlane,
        SecondaryBox,
        getMaxSize,        
        onWindowResize, 
        getFilename} from "../libs/util/util.js";

let scene, renderer, camera, orbit, light;
scene = new THREE.Scene();    // Create main scene
light = initDefaultSpotlight(scene, new THREE.Vector3(2, 3, 2)); // Use default light
renderer = initRenderer();    // View function in util/utils
   renderer.setClearColor("rgb(30, 30, 42)");
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.set(2.18, 1.62, 3.31);
   camera.up.set( 0, 1, 0 );
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.
   orbit.target.set(0, 0.2, 0);
   orbit.update();   

let lightSphere = createSphere(0.1, 10, 10);
  lightSphere.position.copy(light.position);
scene.add(lightSphere);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

let loadingMessage = new SecondaryBox("Loading...");

var groundPlane = createGroundPlane(6.0, 6.0, 80, 80); // width and height
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 3 );
  axesHelper.visible = false;
scene.add( axesHelper );

//---------------------------------------------------------
// Load external objects

// Assets manager --------------------------------
let assetManager = {
   // Properties ---------------------------------
   plane: null,
   L200: null,
   tank: null,
   orca: null,
   woodenGoose: null,
   chair: null,
   allLoaded: false,

   // Functions ----------------------------------
   checkLoaded : function() {
      if(!this.allLoaded)
      {
         if(this.L200 && this.chair && this.orca &&
            this.plane && this.tank && this.woodenGoose){
             this.allLoaded = true;
             loadingMessage.hide(); 
         }
      }
   },   

   hideAll : function() {
      this.orca.visible = this.woodenGoose.visible = this.chair.visible = 
      this.plane.visible = this.L200.visible = this.tank.visible = false;
   }
}

loadOBJFile('../assets/objects/', 'plane', 3.5, 0, true);
loadOBJFile('../assets/objects/', 'L200', 2.5, 90, false);
loadOBJFile('../assets/objects/', 'tank', 2.0, 90, false);

loadGLTFFile('../assets/objects/', 'orca', 4.0, 180, false);
loadGLTFFile('../assets/objects/', 'woodenGoose', 2.0, 90, false);
loadGLTFFile('../assets/objects/','chair', 1.5, 180, false);

buildInterface();
render();

function loadOBJFile(modelPath, modelName, desiredScale, angle, visibility)
{
  var mtlLoader = new MTLLoader( );
  mtlLoader.setPath( modelPath );
  mtlLoader.load( modelName + '.mtl', function ( materials ) {
      materials.preload();

      var objLoader = new OBJLoader( );
      objLoader.setMaterials(materials);
      objLoader.setPath(modelPath);
      objLoader.load( modelName + ".obj", function ( obj ) {
        obj.visible = visibility;
        obj.name = modelName;
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
        obj.rotateY(THREE.MathUtils.degToRad(angle));

        scene.add ( obj );
        assetManager[modelName] = obj;        
      });
  });
}

function loadGLTFFile(modelPath, modelName, desiredScale, angle, visibility)
{
   var loader = new GLTFLoader( );
   loader.load( modelPath + modelName + '.glb', function ( gltf ) {
      var obj = gltf.scene;
      obj.visible = visibility;
      obj.name = getFilename(modelName);
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
      obj.rotateY(THREE.MathUtils.degToRad(angle));

      scene.add ( obj );
      assetManager[modelName] = obj;
   });
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

function createSphere(radius, widthSegments, heightSegments)
{
  var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI);
  var material = new THREE.MeshBasicMaterial({color:"rgb(255,255,50)"});
  var object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
  return object;
}

function buildInterface()
{
  // Interface
  var controls = new function ()
  {
    this.viewAxes = false;
    this.type = "plane";
    this.onChooseObject = function()
    {
      assetManager.hideAll();
      assetManager[this.type].visible = true;   
    };
    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'type',
  ['plane', 'orca', 'woodenGoose', 'chair', 'L200', 'tank'])
     .name("Change Object")
     .onChange(function(e) { controls.onChooseObject(); });
  gui.add(controls, 'viewAxes', false)
     .name("View Axes")
     .onChange(function(e) { controls.onViewAxes() });
}

function render()
{
   assetManager.checkLoaded();
   requestAnimationFrame(render);
   renderer.render(scene, camera)
}
