import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        createGroundPlane,
        onWindowResize, 
        lightFollowingCamera,
        degreesToRadians} from "../libs/util/util.js";

let scene = new THREE.Scene();    // Create main scene
let stats = new Stats();          // To show FPS information

let renderer = initRenderer();    // View function in util/utils
renderer.setClearColor("rgb(30, 30, 40)");
let camera = initCamera(new THREE.Vector3(1,7,9)); // Init camera in this position
let light = initDefaultBasicLight(scene, false, new THREE.Vector3(25, 30, 20)); // Use default light
  
// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

let groundPlane = createGroundPlane(23, 23); // width and height
  groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 5 );
  axesHelper.visible = false;
scene.add( axesHelper );

// Enable mouse rotation, pan, zoom etc.
let trackballControls = new TrackballControls( camera, renderer.domElement );

// Add object to scene
let spGroup; // Will receive the auxiliary spheres representing the points
createCustomGeometry();

buildInterface();
render();

function createCustomGeometry()
{
  // Set the Buffer Geometry
  const geometry = new THREE.BufferGeometry();

  // Create all vertices of the object
  // In this example, we have six vertices
  const v = [
    [-3.0, 0.0, -2.0], // p0
    [-1.0, 2.5, -1.0], // p1 
    [-1.0, 0.0,  0.5], // p2    
    [ 1.0, 2.5,  0.5], // p3
    [ 1.0, 0.0,  0.5], // p4
    [ 3.0, 0.0, -1.0], // p5       
  ] 

  // Create the triangular faces
  // In this example we have 4 triangular faces
  const f = [
    [v[0], v[1], v[2]],
    [v[1], v[2], v[3]],
    [v[2], v[3], v[4]],
    [v[3], v[4], v[5]],        
  ]

  // The length of the Float32Array will be:
  // Number of faces * vertices per face * components per vertex
  // In this example we have 4 faces, 3 vertices per face and 3 components per vertex
  const numberOfFaces = f.length;
  const vertexPerFace = f[0].length; // 3
  const vertexComponents = v[0].length;  // 3
  const size = numberOfFaces * vertexPerFace * vertexComponents;
  const buffer = new Float32Array(size);

  // Populate the final buffer
  // check all faces
  let b = 0;
  for (let i = 0; i < numberOfFaces; i++)
  {
    // check all vertices per face
    for (let j = 0; j < vertexPerFace; j++)      
    {
      // check all components per vertex
      for (let k = 0; k < vertexComponents; k++)      
      {
        buffer[b] = f[i][j][k];
        b++;
      }
    }
  }
   
  // itemSize = 3 because there are 3 values (components) per vertex
  geometry.setAttribute( 'position', new THREE.BufferAttribute( buffer, 3 ) );
  geometry.computeVertexNormals(); // to avoid a flat surface
  const material = new THREE.MeshPhongMaterial({color:"rgb(255,0,0)"});
    material.side =  THREE.DoubleSide; // Show front and back polygons
  const mesh = new THREE.Mesh( geometry, material );

  scene.add(mesh);
  
  // Create auxiliary spheres to visualize the points
  createPointSpheres(v);
}

function createPointSpheres(points)
{
  spGroup = new THREE.Object3D();
  var spMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,255,0)"});
  var spGeometry = new THREE.SphereGeometry(0.1);
  points.forEach(function (points) {
    var spMesh = new THREE.Mesh(spGeometry, spMaterial);   
    spMesh.position.set(points[0], points[1], points[2]);
    spGroup.add(spMesh);
  });
  // add the points as a group to the scene
  scene.add(spGroup);  
}

function buildInterface()
{
  var controls = new function ()
  {
    this.viewPoints = true;
    this.viewAxes = false;

    this.onViewPoints = function(){
      spGroup.visible = this.viewPoints;
    };
    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'viewPoints', false)
    .name("View Points")
    .onChange(function(e) { controls.onViewPoints() });
  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });
}

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  lightFollowingCamera(light, camera) // Makes light follow the camera  
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}