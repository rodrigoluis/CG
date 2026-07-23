import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import Stats from '../build/jsm/libs/stats.module.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

// scene/demo-specific variables go here
let torusObject;
var orbitMoved = false;
let canvas, context;
let stats;
let pathTracingScene, screenCopyScene, screenOutputScene;
let pathTracingUniforms = {};
let screenCopyUniforms, screenOutputUniforms;
let pathTracingDefines;
let pathTracingVertexShader, pathTracingFragmentShader;
let demoFragmentShaderFileName;
let screenCopyFragmentShader;
let screenOutputFragmentShader;
let pathTracingGeometry, pathTracingMaterial, pathTracingMesh;
let screenCopyGeometry, screenCopyMaterial, screenCopyMesh;
let screenOutputGeometry, screenOutputMaterial, screenOutputMesh;
let pathTracingRenderTarget, screenCopyRenderTarget;
let quadCamera, worldCamera;
let renderer, clock;
let sceneIsDynamic = false;
let fovScale;
let elapsedTime;
let apertureSize = 0.0;
let focusDistance = 132.0;
let pixelRatio = 0.5;
let windowIsBeingResized = false;
let sampleCounter = 0.0; // will get increased by 1 in animation loop before rendering
let frameCounter = 1.0; // 1 instead of 0 because it is used as a rng() seed in pathtracing shader
let cameraIsMoving = false;
let cameraRecentlyMoving = false;
let fontAspect;
let EPS_intersect;
let blueNoiseTexture;
let useToneMapping = true;
let allowOrthographicCamera = true;
let pixelEdgeSharpness = 1.0;
let edgeSharpenSpeed = 0.05;
let filterDecaySpeed = 0.0002;
let pixel_ResolutionController, pixel_ResolutionObject;
let needChangePixelResolution = false;
let currentlyUsingOrthographicCamera = false;
let cameraWorldQuaternion = new THREE.Quaternion(); //for rotating scene objects to match camera's current rotation
let fileLoader = new THREE.FileLoader();

init();        // init app 
initTHREEjs(); // init necessary three.js items and scene/demo-specific objects
render();     // everything is set up, now we can start animating

// -----------------------------------------------------------------------------------------------------------
// FUNCTIONS
function onWindowResize(event)
{
	windowIsBeingResized = true;

	// the following change to document.body.clientWidth and Height works better for mobile, especially iOS
	// suggestion from Github user q750831855  - Thank you!
	let SCREEN_WIDTH = document.body.clientWidth; //window.innerWidth; 
	let SCREEN_HEIGHT = document.body.clientHeight; //window.innerHeight;

	renderer.setPixelRatio(pixelRatio);
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

	fontAspect = (SCREEN_WIDTH / 175) * (SCREEN_HEIGHT / 200);
	if (fontAspect > 25) fontAspect = 25;
	if (fontAspect < 4) fontAspect = 4;
	fontAspect *= 2;

	pathTracingUniforms.uResolution.value.x = context.drawingBufferWidth;
	pathTracingUniforms.uResolution.value.y = context.drawingBufferHeight;

	pathTracingRenderTarget.setSize(context.drawingBufferWidth, context.drawingBufferHeight);
	screenCopyRenderTarget.setSize(context.drawingBufferWidth, context.drawingBufferHeight);
   worldCamera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

	// the following scales all scene objects by the worldCamera's field of view,
	// taking into account the screen aspect ratio and multiplying the uniform uULen,
	// the x-coordinate, by this ratio
	fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
	pathTracingUniforms.uVLen.value = Math.tan(fovScale);
	pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;
} // end function onWindowResize( event )


export function init()
{
	window.addEventListener('resize', onWindowResize, false);

	pixel_ResolutionObject = {
		pixel_Resolution: 0.5 // will be set by each demo's js file
	}

	function handlePixelResolutionChange()
	{
		needChangePixelResolution = true;
	}
	function handleCameraProjectionChange()
	{
		if (!currentlyUsingOrthographicCamera)
			changeToOrthographicCamera = true;
		else if (currentlyUsingOrthographicCamera)
			changeToPerspectiveCamera = true;
		// toggle boolean flag
		currentlyUsingOrthographicCamera = !currentlyUsingOrthographicCamera;
	}

	// since I use the lil-gui.min.js minified version of lil-gui without modern exports, 
	//'g()' is 'GUI()' ('g' is the shortened version of 'GUI' inside the lil-gui.min.js file)
	let gui = new GUI(); // same as gui = new GUI();

	pixel_ResolutionController = gui.add(pixel_ResolutionObject, 'pixel_Resolution', 0.5, 1.0, 0.05).onChange(handlePixelResolutionChange);
} // end function init()



function initTHREEjs()
{
	canvas = document.createElement('canvas');

	renderer = new THREE.WebGLRenderer({ canvas: canvas, context: canvas.getContext('webgl2') });
	renderer.debug.checkShaderErrors = true;
	renderer.autoClear = false;
	renderer.toneMapping = THREE.ReinhardToneMapping;

	//required by WebGL 2.0 for rendering to FLOAT textures
	context = renderer.getContext();
	context.getExtension('EXT_color_buffer_float');
   document.getElementById("webgl-output").appendChild(renderer.domElement);

	// container = document.getElementById('container');
	// container.appendChild(renderer.domElement);

	stats = new Stats(); 
	document.getElementById("webgl-output").appendChild(stats.domElement);	

	clock = new THREE.Timer();

	pathTracingScene = new THREE.Scene();
	screenCopyScene = new THREE.Scene();
	screenOutputScene = new THREE.Scene();

	// quadCamera is simply the camera to help render the full screen quad (2 triangles),
	// hence the name.  It is an Orthographic camera that sits facing the view plane, which serves as
	// the window into our 3d world. This camera will not move or rotate for the duration of the app.
	quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	screenCopyScene.add(quadCamera);
	screenOutputScene.add(quadCamera);

	// worldCamera is the dynamic camera 3d object that will be positioned, oriented and 
	// constantly updated inside the 3d scene.  Its view will ultimately get passed back to the 
	// stationary quadCamera, which renders the scene to a fullscreen quad (made up of 2 large triangles).
	worldCamera = new THREE.PerspectiveCamera(60, document.body.clientWidth / document.body.clientHeight, 1, 1000);
	pathTracingScene.add(worldCamera);
	worldCamera.position.set(0, 45, 120);

   let orbit = new OrbitControls( worldCamera, renderer.domElement );
   orbit.addEventListener( 'change', 
      () => orbitMoved = true
   );

	// setup render targets...
	pathTracingRenderTarget = new THREE.WebGLRenderTarget(context.drawingBufferWidth, context.drawingBufferHeight, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: false,
		stencilBuffer: false
	});
	pathTracingRenderTarget.texture.generateMipmaps = false;

	screenCopyRenderTarget = new THREE.WebGLRenderTarget(context.drawingBufferWidth, context.drawingBufferHeight, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: false,
		stencilBuffer: false
	});
	screenCopyRenderTarget.texture.generateMipmaps = false;

	// blueNoise texture used in all demos
	blueNoiseTexture = new THREE.TextureLoader().load('../libs/pathTracing/noise/BlueNoise_RGBA256.png');
	blueNoiseTexture.wrapS = THREE.RepeatWrapping;
	blueNoiseTexture.wrapT = THREE.RepeatWrapping;
	blueNoiseTexture.flipY = false;
	blueNoiseTexture.minFilter = THREE.NearestFilter;
	blueNoiseTexture.magFilter = THREE.NearestFilter;
	blueNoiseTexture.generateMipmaps = false;

	// setup scene/demo-specific objects, variables, GUI elements, and data
	initSceneData();
	pixel_ResolutionController.setValue(pixelRatio);

	// this full-screen quad mesh performs the path tracing operations and produces a screen-sized image
	pathTracingGeometry = new THREE.PlaneGeometry(2, 2);
	pathTracingUniforms.tPreviousTexture = { type: "t", value: screenCopyRenderTarget.texture };
	pathTracingUniforms.tBlueNoiseTexture = { type: "t", value: blueNoiseTexture };
	pathTracingUniforms.uCameraMatrix = { type: "m4", value: new THREE.Matrix4() };
	pathTracingUniforms.uResolution = { type: "v2", value: new THREE.Vector2() };
	pathTracingUniforms.uRandomVec2 = { type: "v2", value: new THREE.Vector2() };
	pathTracingUniforms.uEPS_intersect = { type: "f", value: EPS_intersect };
	pathTracingUniforms.uTime = { type: "f", value: 0.0 };
	pathTracingUniforms.uSampleCounter = { type: "f", value: 0.0 }; //0.0
	pathTracingUniforms.uPreviousSampleCount = { type: "f", value: 1.0 };
	pathTracingUniforms.uFrameCounter = { type: "f", value: 1.0 }; //1.0
	pathTracingUniforms.uULen = { type: "f", value: 1.0 };
	pathTracingUniforms.uVLen = { type: "f", value: 1.0 };
	pathTracingUniforms.uApertureSize = { type: "f", value: apertureSize };
	pathTracingUniforms.uFocusDistance = { type: "f", value: focusDistance };
	pathTracingUniforms.uCameraIsMoving = { type: "b1", value: false };
	pathTracingUniforms.uUseOrthographicCamera = { type: "b1", value: false };

	pathTracingDefines = {
		//NUMBER_OF_TRIANGLES: total_number_of_triangles
	};

	// load vertex and fragment shader files that are used in the pathTracing material, mesh and scene
	fileLoader.load('../libs/pathTracing/shaders/common_PathTracing_Vertex.glsl', function (vertexShaderText)
	{
		pathTracingVertexShader = vertexShaderText;

		fileLoader.load(demoFragmentShaderFileName, function (fragmentShaderText)
		{
			pathTracingFragmentShader = fragmentShaderText;
			pathTracingMaterial = new THREE.ShaderMaterial({
				uniforms: pathTracingUniforms,
				defines: pathTracingDefines,
				vertexShader: pathTracingVertexShader,
				fragmentShader: pathTracingFragmentShader,
				depthTest: false,
				depthWrite: false
			});
			pathTracingMesh = new THREE.Mesh(pathTracingGeometry, pathTracingMaterial);
			pathTracingScene.add(pathTracingMesh);

			// the following keeps the large scene ShaderMaterial quad right in front 
			//   of the camera at all times. This is necessary because without it, the scene 
			//   quad will fall out of view and get clipped when the camera rotates past 180 degrees.
			worldCamera.add(pathTracingMesh);
		});
	});

	// this full-screen quad mesh copies the image output of the pathtracing shader and feeds it back in to that shader as a 'previousTexture'
	screenCopyGeometry = new THREE.PlaneGeometry(2, 2);
	screenCopyUniforms = {
		tPathTracedImageTexture: { type: "t", value: pathTracingRenderTarget.texture }
	};

	fileLoader.load('../libs/pathTracing/shaders/ScreenCopy_Fragment.glsl', function (shaderText) {
		screenCopyFragmentShader = shaderText;
		screenCopyMaterial = new THREE.ShaderMaterial({
			uniforms: screenCopyUniforms,
			vertexShader: pathTracingVertexShader,
			fragmentShader: screenCopyFragmentShader,
			depthWrite: false,
			depthTest: false
		});

		screenCopyMesh = new THREE.Mesh(screenCopyGeometry, screenCopyMaterial);
		screenCopyScene.add(screenCopyMesh);
	});


	// this full-screen quad mesh takes the image output of the path tracing shader (which is a continuous blend of the previous frame and current frame),
	// and applies gamma correction (which brightens the entire image), and then displays the final accumulated rendering to the screen
	screenOutputGeometry = new THREE.PlaneGeometry(2, 2);
	screenOutputUniforms = {
		tPathTracedImageTexture: { type: "t", value: pathTracingRenderTarget.texture },
		uSampleCounter: { type: "f", value: 0.0 },
		uOneOverSampleCounter: { type: "f", value: 0.0 },
		uPixelEdgeSharpness: { type: "f", value: pixelEdgeSharpness },
		uEdgeSharpenSpeed: { type: "f", value: edgeSharpenSpeed },
		uFilterDecaySpeed: { type: "f", value: filterDecaySpeed },
		uSceneIsDynamic: { type: "b1", value: sceneIsDynamic },
		uUseToneMapping: { type: "b1", value: useToneMapping }
	};

	fileLoader.load('../libs/pathTracing/shaders/ScreenOutput_Fragment.glsl', function (shaderText) {
		screenOutputFragmentShader = shaderText;
		screenOutputMaterial = new THREE.ShaderMaterial({
			uniforms: screenOutputUniforms,
			vertexShader: pathTracingVertexShader,
			fragmentShader: screenOutputFragmentShader,
			depthWrite: false,
			depthTest: false
		});
		screenOutputMesh = new THREE.Mesh(screenOutputGeometry, screenOutputMaterial);
		screenOutputScene.add(screenOutputMesh);
	});

	// this 'jumpstarts' the initial dimensions and parameters for the window and renderer
	onWindowResize();
} // end function initTHREEjs()

function render()
{
   clock.update();
	elapsedTime = clock.getElapsed() % 1000;

	// reset flags
	cameraIsMoving = false;

	// if GUI has been used, update
	if (needChangePixelResolution)
	{
		pixelRatio = pixel_ResolutionController.getValue();
		onWindowResize();
		needChangePixelResolution = false;
	}

	if (windowIsBeingResized)
	{
		cameraIsMoving = true;
		windowIsBeingResized = false;
	}

   if(orbitMoved)
   {
      cameraIsMoving = true;
      orbitMoved = false;  
    }

	// the following gives us a rotation quaternion (4D vector), which will be useful for 
	// rotating scene objects to match the camera's rotation
	worldCamera.getWorldQuaternion(cameraWorldQuaternion);
		
	// update scene/demo-specific input(if custom), variables and uniforms every animation frame
	updateVariablesAndUniforms();

	// now update uniforms that are common to all scenes
	if (!cameraIsMoving)
	{
		if (sceneIsDynamic)
			sampleCounter = 1.0; // reset for continuous updating of image
		else sampleCounter += 1.0; // for progressive refinement of image

		frameCounter += 1.0;

		cameraRecentlyMoving = false;
	}

	if (cameraIsMoving)
	{
		frameCounter += 1.0;

		if (!cameraRecentlyMoving)
		{
			// record current sampleCounter before it gets set to 1.0 below
			pathTracingUniforms.uPreviousSampleCount.value = sampleCounter;
			frameCounter = 1.0;
			cameraRecentlyMoving = true;
		}

		sampleCounter = 1.0;
	}

	pathTracingUniforms.uTime.value = elapsedTime;
	pathTracingUniforms.uCameraIsMoving.value = cameraIsMoving;
	pathTracingUniforms.uSampleCounter.value = sampleCounter;
	pathTracingUniforms.uFrameCounter.value = frameCounter;
	pathTracingUniforms.uRandomVec2.value.set(Math.random(), Math.random());

	// CAMERA
	//cameraControlsObject.updateMatrixWorld(true);
	worldCamera.updateMatrixWorld(true);
	pathTracingUniforms.uCameraMatrix.value.copy(worldCamera.matrixWorld);

	screenOutputUniforms.uSampleCounter.value = sampleCounter;
	// PROGRESSIVE SAMPLE WEIGHT (reduces intensity of each successive animation frame's image)
	screenOutputUniforms.uOneOverSampleCounter.value = 1.0 / sampleCounter;
	
	// RENDERING in 3 steps

	// STEP 1
	// Perform PathTracing and Render(save) into pathTracingRenderTarget, a full-screen texture.
	// Read previous screenCopyRenderTarget(via texelFetch inside fragment shader) to use as a new starting point to blend with
	renderer.setRenderTarget(pathTracingRenderTarget);
	renderer.render(pathTracingScene, worldCamera);

	// STEP 2
	// Render(copy) the pathTracingScene output(pathTracingRenderTarget above) into screenCopyRenderTarget.
	// This will be used as a new starting point for Step 1 above (essentially creating ping-pong buffers)
	renderer.setRenderTarget(screenCopyRenderTarget);
	renderer.render(screenCopyScene, quadCamera);

	// STEP 3
	// Render full screen quad with generated pathTracingRenderTarget in STEP 1 above.
	// After applying tonemapping and gamma-correction to the image, it will be shown on the screen as the final accumulated output
	renderer.setRenderTarget(null);
	renderer.render(screenOutputScene, quadCamera);

	stats.update();
	requestAnimationFrame(render);

} // end function render()

// called automatically from within initTHREEjs() function (located in InitCommon.js file)
function initSceneData()
{
	demoFragmentShaderFileName = '../libs/pathTracing/shaders/pathTracingExample.glsl';

	// scene/demo-specific three.js objects setup goes here
	sceneIsDynamic = false;
	
	// pixelRatio is resolution - range: 0.5(half resolution) to 1.0(full resolution)
	//pixelRatio = mouseControl ? 0.75 : 0.8;
   pixelRatio = 0.8;   

	EPS_intersect = 0.01;

	// Torus Object
	torusObject = new THREE.Object3D();
	pathTracingScene.add(torusObject);

	torusObject.rotation.set((Math.PI * 0.5) - 0.05, -0.05, 0);
	torusObject.position.set(-60, 6, 50);
	torusObject.scale.set(11.5, 11.5, 11.5);

	// set camera's field of view
	worldCamera.fov = 60;
	focusDistance = 130.0;

	// scene/demo-specific uniforms go here
	pathTracingUniforms.uTorusInvMatrix = { value: new THREE.Matrix4() };

} // end function initSceneData()

// called automatically from within the animate() function (located in InitCommon.js file)
function updateVariablesAndUniforms()
{
	// TORUS
	torusObject.updateMatrixWorld(true); // 'true' forces immediate matrix update
	pathTracingUniforms.uTorusInvMatrix.value.copy(torusObject.matrixWorld).invert();
} // end function updateVariablesAndUniforms()


