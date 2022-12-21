import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { TeapotGeometry } from '../build/jsm/geometries/TeapotGeometry.js';
import {
   initRenderer,
   initCamera,
   initDefaultSpotlight,
   createGroundPlaneXZ,
   onWindowResize
} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(3.6, 4.6, 8.2)); // Init camera in this position
//material = setDefaultMaterial(); // create a basic material
light = initDefaultSpotlight(scene, new THREE.Vector3(5.0, 5.0, 5.0)); // Use default light    
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlaneXZ(10, 10, 40, 40); // width, height, resolutionW, resolutionH
scene.add(groundPlane);

// Create objects
createTeapot(2.0, 0.4, 0.0, Math.random() * 0xffffff);
createTeapot(0.0, 0.4, 2.0, Math.random() * 0xffffff);
createTeapot(0.0, 0.4, -2.0, Math.random() * 0xffffff);

//-------------------------------------------------------------------------------
// Setting virtual camera
//-------------------------------------------------------------------------------
let lookAtVec = new THREE.Vector3(0.0, 0.0, 0.0);
let camPosition = new THREE.Vector3(3.7, 2.2, 1.0);
let upVec = new THREE.Vector3(0.0, 1.0, 0.0);

let projectionChanged = false;
let virtualCamera = new THREE.PerspectiveCamera(45, 1.3, 1.0, 20.0);
virtualCamera.position.copy(camPosition);
virtualCamera.up.copy(upVec);
virtualCamera.lookAt(lookAtVec);

// Create helper for the virtual camera
const cameraHelper = new THREE.CameraHelper(virtualCamera);
scene.add(cameraHelper);

// Create 3D representation of the camera (cube and cone)
let cameraObj = createCameraObject();

buildInterface();
updateCamera();
render();

function createCameraObject() {
   let matBody = new THREE.MeshPhongMaterial({ color: "rgb(255, 0, 0)" });
   let matLens = new THREE.MeshPhongMaterial({ color: "rgb(255, 255, 0)" });

   let cBody = new THREE.BoxGeometry(.2, .2, .2);
   let body = new THREE.Mesh(cBody, matBody);

   let cLens = new THREE.ConeGeometry(0.1, 0.2, 20);
   let lens = new THREE.Mesh(cLens, matLens);
   lens.rotateX(THREE.MathUtils.degToRad(90));
   lens.position.set(0.0, 0.0, -0.1);
   body.add(lens); // Add lens to the body of the camera

   scene.add(body); // Add camera object to scene
   return body;
}

function createTeapot(x, y, z, color) {
   let geometry = new TeapotGeometry(0.5);
   let material = new THREE.MeshPhongMaterial({ color, shininess: "200" });
   material.side = THREE.DoubleSide;
   let obj = new THREE.Mesh(geometry, material);
   obj.castShadow = true;
   obj.position.set(x, y, z);
   scene.add(obj);
}

// Updates de 3D object that represents the virtual camera 
// and the camera helper
function updateVirtualCameraObject() {
   //-- Update camera 3D representation --
   let cwd = new THREE.Vector3();
   virtualCamera.getWorldPosition(cwd);
   cameraObj.position.copy(cwd);
   cameraObj.setRotationFromQuaternion(virtualCamera.quaternion); // Get camera rotation

   cameraHelper.update();
}

function updateCamera() {
   //-- Update virtual camera settings --
   virtualCamera.position.copy(camPosition);
   virtualCamera.up.copy(upVec);
   virtualCamera.lookAt(lookAtVec);

   // Update projection only if fov, near or far plane change
   if (projectionChanged) {
      virtualCamera.updateProjectionMatrix();
      projectionChanged = false;
   }

   // Update the object that represents the virtual camera and the its helper
   updateVirtualCameraObject();
}

function buildInterface() {
   //------------------------------------------------------------
   // Interface
   let controls = new function () {
      this.upAngle = 0;
      this.viewPortTransparency = false;

      this.onChangeVPTransparency = function () {
         // Control viewport transparency through renderer autoclear property
         renderer.autoClear = !renderer.autoClear;
      }

      this.onUpdateNear = function () {
         if (virtualCamera.near >= virtualCamera.far) // set near always smaller than far
            virtualCamera.far = virtualCamera.near + 10;
         projectionChanged = true;
         updateCamera();
      };

      this.onUpdateFar = function () {
         if (virtualCamera.far <= virtualCamera.near - 0.1) // set far always greater than near
            virtualCamera.near = 0.1;
         projectionChanged = true;
         updateCamera();
      };

      this.onUpdateFov = function () {
         projectionChanged = true;
         updateCamera();
      };

      this.onUpdateUpAngle = function () {
         upVec.x = Math.sin(THREE.MathUtils.degToRad(this.upAngle));
         upVec.y = Math.cos(THREE.MathUtils.degToRad(this.upAngle));
         updateCamera();
      };
   }

   function makeXYZGUI(gui, vector3, name, onChangeFn) {
      const folder = gui.addFolder(name);
      folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
      folder.add(vector3, 'y', -10, 10).onChange(onChangeFn);
      folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
      folder.open();
   }

   let gui = new GUI();

   let vcFolder = gui.addFolder("Virtual Camera");
   vcFolder.open();
   vcFolder.add(cameraHelper, 'visible', true)
      .name("Camera Helper");
   vcFolder.add(controls, 'viewPortTransparency', false)
      .onChange(function () { controls.onChangeVPTransparency() })
      .name("VP Transparency");
   vcFolder.add(virtualCamera, 'near', .1, 30, 0.1)
      .onChange(function () { controls.onUpdateNear() })
      .name("Near plane");
   vcFolder.add(virtualCamera, 'far', .1, 30, 0.1)
      .onChange(function () { controls.onUpdateFar() })
      .name("Far plane");
   vcFolder.add(virtualCamera, 'fov', 10, 90)
      .onChange(function () { controls.onUpdateFov() })
      .name("Fov (degrees)");
   vcFolder.add(controls, 'upAngle', 0, 360)
      .onChange(function () { controls.onUpdateUpAngle() })
      .name("Up (degrees)");
   makeXYZGUI(vcFolder, camPosition, 'Position', updateCamera);
   makeXYZGUI(vcFolder, lookAtVec, 'Look At', updateCamera);
}

function controlledRender() {
   let width = window.innerWidth;
   let height = window.innerHeight;

   // Set main viewport
   renderer.setViewport(0, 0, width, height); // Reset viewport    
   renderer.setScissorTest(false); // Disable scissor to paint the entire window
   renderer.setClearColor("rgb(80, 70, 170)");
   renderer.clear();   // Clean the window
   renderer.render(scene, camera);

   // If autoClear if false, clear depth buffer to avoid unwanted overlays
   if (!renderer.autoClear) renderer.clearDepth()  // Clean the small viewport   

   // Set virtual camera viewport 
   let offset = 10;
   let vcWidth = (width / 3.0 > 400) ? 400 : width / 3.0;
   let vcHeidth = vcWidth * 0.75;
   renderer.setViewport(offset, height - vcHeidth - offset, vcWidth, vcHeidth);  // Set virtual camera viewport  
   renderer.setScissor(offset, height - vcHeidth - offset, vcWidth-1 , vcHeidth-1); // Set scissor with the same size as the viewport - 1 
   renderer.setScissorTest(true); // Enable scissor to paint only the scissor are (i.e., the small viewport)
   renderer.setClearColor("rgb(60, 50, 150)");  // Use a darker clear color in the small viewport 
   renderer.render(scene, virtualCamera);  // Render scene of the virtual camera
}

function render() {
   controlledRender();
   requestAnimationFrame(render);
}