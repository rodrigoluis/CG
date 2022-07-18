import * as THREE from  'three';

import {SecondaryBox} from "../libs/util/util.js";

import { init,
         animate,
         pathTracingScene,
         worldCamera,
         apertureSize,
         sampleCounter,
         cameraControlsObject,
         pathTracingUniforms,
         setMainValues} from '../libs/pathTracing/initCommon.js';

// scene/demo-specific variables go here
let torusObject;

let dynamic = false;
let cameraFlightSpeed = 60;
let pixelRatio = 0.8;
let EPS_intersect = 0.01;
let focusDistance = 130.0;

let noiseFile = '../libs/pathTracing/noise/blueNoise_RGBA256.png'
let pathTracingGLSL = '../libs/pathTracing/shaders/pathTracingExample1.glsl';
let commonGLSL = '../libs/pathTracing/shaders/common_PathTracing_Vertex.glsl';
let screenCpyGLSL = '../libs/pathTracing/shaders/ScreenCopy_Fragment.glsl';
let screenOutGLSL = '../libs/pathTracing/shaders/ScreenOutput_Fragment.glsl';

setMainValues(dynamic, cameraFlightSpeed,pixelRatio, EPS_intersect, focusDistance, noiseFile,
              pathTracingGLSL, commonGLSL, screenCpyGLSL, screenOutGLSL)

let message = new SecondaryBox("");
   message.changeStyle("rgba(0,0,0,0)", "white", "20px", "Arial")


// called automatically from within initTHREEjs() function (located in InitCommon.js file)
export function initSceneData()
{
	// Torus Object
	torusObject = new THREE.Object3D();
	pathTracingScene.add(torusObject);

	torusObject.rotation.set((Math.PI * 0.5) - 0.05, -0.05, 0);
	torusObject.position.set(-60, 6, 50);
	torusObject.scale.set(11.5, 11.5, 11.5);

	// position and orient camera
	cameraControlsObject.position.set(0, 20, 120);
	///cameraControlsYawObject.rotation.y = 0.0;
	// look slightly downward
	///cameraControlsPitchObject.rotation.x = -0.4;

	// scene/demo-specific uniforms go here
	pathTracingUniforms.uTorusInvMatrix = { value: new THREE.Matrix4() };

} // end function initSceneData()



// called automatically from within the animate() function (located in InitCommon.js file)
export function updateVariablesAndUniforms()
{
	// TORUS
	torusObject.updateMatrixWorld(true); // 'true' forces immediate matrix update
	pathTracingUniforms.uTorusInvMatrix.value.copy(torusObject.matrixWorld).invert();

   if(worldCamera)
   {
      let output = "FOV: " + worldCamera.fov + " / Aperture: " + apertureSize.toFixed(2) + " / FocusDistance: " + focusDistance + " / Samples: " + sampleCounter;
      message.changeMessage(output);
   }
} // end function updateVariablesAndUniforms()

init(); // init app and start animating
initSceneData();

render();
function render()
{
   animate();
   updateVariablesAndUniforms();
   requestAnimationFrame(render);
}
