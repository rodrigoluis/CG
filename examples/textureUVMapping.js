import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        onWindowResize, 
        lightFollowingCamera} from "../libs/util/util.js";

let scene = new THREE.Scene();    // Create main scene
let stats = new Stats();          // To show FPS information

let renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 40)");
let camera = initCamera(new THREE.Vector3(0,0,9)); // Init camera in this position
let light = initDefaultBasicLight(scene, false, new THREE.Vector3(25, 30, 20)); // Use default light
  
// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 5 );
  axesHelper.visible = false;
scene.add( axesHelper );

// Enable mouse rotation, pan, zoom etc.
let trackballControls = new TrackballControls( camera, renderer.domElement );

// Elements to be used in UI
let spGroup;  // Will receive the auxiliary spheres representing the points
let material; // to change between flat and shading material

// Create custom object
createCustomGeometry();

buildInterface();
render();

function createCustomGeometry()
{
  // Create all vertices of the object
  // In this example, we have five vertices
  let v = [-4.0, -2.0, -1.5, // p0
           -2.0,  2.0,  0.0, // p1 
            0.0, -2.0,  1.5, // p2  
            2.0,  2.0,  0.0, // p4
            4.0, -2.0,  -1.5] // p3            

  // Create the triangular faces
  // In this example we have 3 triangular faces
  let f =  [0, 2, 1,   
            1, 2, 3,
            4, 3, 2];

  // In this example normals = vertices because the center of the object is the origin. 
  // You may have to compute your normals manually.
  const n = v;

  // Set buffer attributes
  var vertices = new Float32Array( v );
  var normals = new Float32Array( n );  
  var indices = new Uint32Array( f );

  // Set the Buffer Geometry
  let geometry = new THREE.BufferGeometry();

  geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) ); // 3 components per vertex
  geometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );  // 3 components per normal
  geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
  geometry.computeVertexNormals(); 

  material = new THREE.MeshPhongMaterial({color:"rgb(255,255,255)"});
    material.side =  THREE.DoubleSide; // Show front and back polygons
    material.flatShading = true;
  const mesh = new THREE.Mesh( geometry, material );

  // This function will set UV coordinates and texture
  setTexture(mesh);

  scene.add(mesh);
 
  // Create auxiliary spheres to visualize the points
  createPointSpheres(v);
}

function setTexture(mesh) {
  let geometry = mesh.geometry;
  let material = mesh.material;

  // You must set an individual UV coordinate for each vertex of your scene
  // Learn more here:
  // https://discoverthreejs.com/book/first-steps/textures-intro/
  var uvCoords = [0.0, 0.0,
                  0.3, 1.0,
                  0.5, 0.0,
                  0.7, 1.0,
                  1.0, 0.0];

  geometry.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvCoords), 2 ) );

  // Load the texture and set to the material of the mesh
  let texture = new THREE.TextureLoader().load('../assets/textures/art.jpg');
  material.map =  texture;
}

function createPointSpheres(points)
{
  spGroup = new THREE.Object3D();
  var spMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,255,0)"});
  var spGeometry = new THREE.SphereGeometry(0.1);
  for(let i = 0; i < points.length; i+=3){
    var spMesh = new THREE.Mesh(spGeometry, spMaterial);   
    spMesh.position.set(points[i], points[i+1], points[i+2]);
    spGroup.add(spMesh);
  };
  // add the points as a group to the scene
  scene.add(spGroup);  
}

function buildInterface()
{
  var controls = new function ()
  {
    this.viewPoints = true;
    this.viewAxes = false;
    this.flatShading = true;
    
    this.onFlatShading = function(){
      material.flatShading = this.flatShading;
      material.needsUpdate = true;
    };
    this.onViewPoints = function(){
      spGroup.visible = this.viewPoints;
    };
    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'flatShading', true)
    .name("Flat Shading")
    .onChange(function(e) { controls.onFlatShading() });
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