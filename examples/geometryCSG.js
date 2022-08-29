/*
Return a new CSG solid representing space in either this solid or in the
solid `csg`. Neither this solid nor the solid `csg` are modified.

    A.union(B)

    +-------+            +-------+
    |       |            |       |
    |   A   |            |       |
    |    +--+----+   =   |       +----+
    +----+--+    |       +----+       |
         |   B   |            |       |
         |       |            |       |
         +-------+            +-------+

Return a new CSG solid representing space in this solid but not in the
solid `csg`. Neither this solid nor the solid `csg` are modified.

    A.subtract(B)

    +-------+            +-------+
    |       |            |       |
    |   A   |            |       |
    |    +--+----+   =   |    +--+
    +----+--+    |       +----+
         |   B   |
         |       |
         +-------+

Return a new CSG solid representing space both this solid and in the
solid `csg`. Neither this solid nor the solid `csg` are modified.

    A.intersect(B)

    +-------+
    |       |
    |   A   |
    |    +--+----+   =   +--+
    +----+--+    |       +--+
         |   B   |
         |       |
         +-------+
*/

import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer,
        initCamera, 
        initDefaultBasicLight,
        createGroundPlane,
        onWindowResize} from "../libs/util/util.js";

import { CSG } from '../libs/other/CSGMesh.js'        

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

var renderer = initRenderer();    // View function in util/utils
renderer.setClearColor("rgb(30, 30, 40)");
var camera = initCamera(new THREE.Vector3(4, -8, 8)); // Init camera in this position
   camera.up.set( 0, 0, 1 );

window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
initDefaultBasicLight(scene, true, new THREE.Vector3(12, -15, 20), 28, 1024) ;	

var groundPlane = createGroundPlane(20, 20); // width and height (x, y)
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

var trackballControls = new TrackballControls( camera, renderer.domElement );

// To be used in the interface
let mesh1, mesh2, mesh3;

buildInterface();
buildObjects();
render();

function buildObjects()
{
   let auxMat = new THREE.Matrix4();
   
   // Base objects
   let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2))
   let sphereMesh = new THREE.Mesh( new THREE.SphereGeometry(1.45, 20, 20) )
   let cylinderMesh = new THREE.Mesh( new THREE.CylinderGeometry(0.85, 0.85, 2, 20))
   let torusMesh = new THREE.Mesh( new THREE.TorusGeometry(0.8, 0.2, 20, 20))   

   // CSG holders
   let csgObject, cubeCSG, sphereCSG, cylinderCSG, torusCSG

   // Object 1 - Cube SUBTRACT Sphere
   sphereMesh.position.set(1, -0.5, 0.5)
   updateObject(sphereMesh) // update internal coords
   sphereCSG = CSG.fromMesh(sphereMesh)  
   cubeCSG = CSG.fromMesh(cubeMesh)   
   csgObject = cubeCSG.subtract(sphereCSG) // Execute subtraction
   mesh1 = CSG.toMesh(csgObject, auxMat)
   mesh1.material = new THREE.MeshPhongMaterial({color: 'lightgreen'})
   mesh1.position.set(0, 0, 1.02)
   scene.add(mesh1)

   // Object 2 - Cube INTERSECT Cylinder
   cylinderMesh.position.set(1, -0.5, 0.0)
   updateObject(cylinderMesh)
   cylinderCSG = CSG.fromMesh(cylinderMesh)
   cubeCSG = CSG.fromMesh(cubeMesh)   
   csgObject = cubeCSG.intersect(cylinderCSG) // Execute intersection
   mesh2 = CSG.toMesh(csgObject, auxMat)
   mesh2.material = new THREE.MeshPhongMaterial({color: 'lightblue'})
   mesh2.position.set(3, 0, 0.9)
   scene.add(mesh2)

   // Object 3 - Cube UNION torus
   torusMesh.rotateX(THREE.MathUtils.degToRad(90))
   torusMesh.position.set(0.0, 0.0, 1.0) // reset position
   updateObject(torusMesh) 
   torusCSG = CSG.fromMesh(torusMesh)
   cubeCSG = CSG.fromMesh(cubeMesh)

   csgObject = cubeCSG.union(torusCSG) // Execute union
   mesh3 = CSG.toMesh(csgObject, auxMat)
   mesh3.material = new THREE.MeshPhongMaterial({color: 'indianred'})
   mesh3.position.set(-4, 0, 1.02)
   scene.add(mesh3)
}

function updateObject(mesh)
{
   mesh.matrixAutoUpdate = false;
   mesh.updateMatrix();
}

function buildInterface()
{
  var controls = new function ()
  {
    this.wire = false;
    
    this.onWireframeMode = function(){
       mesh1.material.wireframe = this.wire;
       mesh2.material.wireframe = this.wire;       
       mesh3.material.wireframe = this.wire;              
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'wire', false)
    .name("Wireframe")
    .onChange(function(e) { controls.onWireframeMode() });
}

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
