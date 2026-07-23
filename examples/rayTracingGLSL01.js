import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

// scene/demo-specific variables go here
let UVGridTexture;
let groundRectangle, box, wedge;
let diffuseSphere, metalSphere, coatSphere, glassSphere;
let cylinder, cone, paraboloid, hyperboloid, hyperbolicParaboloid;
let cappedCone;
var SCREEN_WIDTH;
var SCREEN_HEIGHT;
var context;
var rayTracingScene, screenCopyScene, screenOutputScene;
var rayTracingUniforms = {};
var rayTracingUniformsGroups = [];
var screenCopyUniforms, screenOutputUniforms;
var rayTracingDefines;
var rayTracingVertexShader, rayTracingFragmentShader;
//var demoFragmentShaderFileName;
var screenCopyFragmentShader;
var screenOutputFragmentShader;
var rayTracingGeometry, rayTracingMaterial, rayTracingMesh;
var screenCopyGeometry, screenCopyMaterial, screenCopyMesh;
var screenOutputGeometry, screenOutputMaterial, screenOutputMesh;
var rayTracingRenderTarget, screenCopyRenderTarget;
var quadCamera
var worldCamera;
var renderer;
var orbitMoved = false;
var clock;
var sceneIsDynamic = false;
var fovScale;
var apertureSize = 0.0;
var apertureChangeSpeed = 1;
var focusDistance = 132.0;
var focusChangeSpeed = 1;
var pixelRatio = 0.75;
var windowIsBeingResized = false;
var TWO_PI = Math.PI * 2;
var sampleCounter = 0.0; // will get increased by 1 in animation loop before rendering
var frameCounter = 1.0; // 1 instead of 0 because it is used as a rng() seed in raytracing shader
var cameraIsMoving = false;
var cameraRecentlyMoving = false;
var isPaused = true;
var oldYawRotation, oldPitchRotation;
var EPS_intersect = 0.01;
var blueNoiseTexture;
var useToneMapping = true;
var  pixel_ResolutionController, pixel_ResolutionObject;
var  needChangePixelResolution = false;
var  cameraWorldQuaternion;// = new THREE.Quaternion(); 

// Listeners
window.addEventListener('resize', onWindowResize, false);
window.addEventListener('orientationchange', onWindowResize, false);


initTHREEjs();
initSceneData();
render();

//----------------------------------------------------------------------------------
// FUNCTIONS
//----------------------------------------------------------------------------------
function render()
{
   clock.update();
	let frameTime = clock.getDelta();
	let elapsedTime = clock.getElapsed() % 1000;
   
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
   cameraWorldQuaternion = new THREE.Quaternion(); 
	worldCamera.getWorldQuaternion(cameraWorldQuaternion);

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
			// record current sampleCounter before sampleCounter gets set to 1.0 below
			rayTracingUniforms.uPreviousSampleCount.value = sampleCounter;
			frameCounter = 1.0;
			cameraRecentlyMoving = true;
		}
		sampleCounter = 1.0;
	}

	rayTracingUniforms.uTime.value = elapsedTime;
	rayTracingUniforms.uSceneIsDynamic.value = sceneIsDynamic;
	rayTracingUniforms.uCameraIsMoving.value = cameraIsMoving;
	rayTracingUniforms.uSampleCounter.value = sampleCounter;
	rayTracingUniforms.uFrameCounter.value = frameCounter;
	rayTracingUniforms.uRandomVec2.value.set(Math.random(), Math.random());

	// CAMERA
	//cameraControlsObject.updateMatrixWorld(true);
	worldCamera.updateMatrixWorld(true);
	rayTracingUniforms.uCameraMatrix.value.copy(worldCamera.matrixWorld);

	// PROGRESSIVE SAMPLE WEIGHT (reduces intensity of each successive animation frame's image)
	screenOutputUniforms.uOneOverSampleCounter.value = 1.0 / sampleCounter;
	
	// RENDERING in 3 steps

	// STEP 1
	// Perform RayTracing and Render(save) into rayTracingRenderTarget, a full-screen texture.
	// Read previous screenCopyRenderTarget(via texelFetch inside fragment shader) to use as a new starting point to blend with
	renderer.setRenderTarget(rayTracingRenderTarget);
	renderer.render(rayTracingScene, worldCamera);

	// STEP 2
	// Render(copy) the rayTracingScene output(rayTracingRenderTarget above) into screenCopyRenderTarget.
	// This will be used as a new starting point for Step 1 above (essentially creating ping-pong buffers)
	renderer.setRenderTarget(screenCopyRenderTarget);
	renderer.render(screenCopyScene, quadCamera);

	// STEP 3
	// Render full screen quad with generated rayTracingRenderTarget in STEP 1 above.
	// After applying tonemapping and gamma-correction to the image, it will be shown on the screen as the final accumulated output
	renderer.setRenderTarget(null);
	renderer.render(screenOutputScene, quadCamera);

	requestAnimationFrame(render);

} // end function render()

// the 'type' function argument below is a string in JavaScript. Possible string values are: "rectangle", "disk", "box", "sphere", "cylinder", "capped cylinder", 
// "cone", "capped cone", "paraboloid", "capped paraboloid", "hyperboloid", "hyperbolic paraboloid", "capsule", "triangular wedge", "convex polyhedron"
function RayTracingShape(type)
{
	this.type = type;
	this.transform = new THREE.Object3D();
	this.transform.visible = false;
	
	this.material = new THREE.MeshPhysicalMaterial({
		color: new THREE.Color(1.0, 1.0, 1.0), // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
		opacity: 1.0, // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
		ior: 1.5, // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
		clearcoat: 0.0, // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
		metalness: 0.0, // range: either 0.0 or 1.0 / default is 0.0 (not metal)
		roughness: 0.0 // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)
	});

	this.material.isCheckered = 0.0; // range: either 0.0 (not checkered) or 1.0 (checkered) / default is 0.0 (not checkered)
	this.material.color2 = new THREE.Color(0.0, 0.0, 0.0); // .color2 is used if this shape will have a checkered material

	this.uvScale = new THREE.Vector2(1, 1);

	return this;
}

function onWindowResize(event)
{
	windowIsBeingResized = true;

	// the following change to document.body.clientWidth and Height works better for mobile, especially iOS
	// suggestion from Github user q750831855  - Thank you!
	SCREEN_WIDTH = document.body.clientWidth; //window.innerWidth; 
	SCREEN_HEIGHT = document.body.clientHeight; //window.innerHeight;

	renderer.setPixelRatio(pixelRatio);
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

	rayTracingUniforms.uResolution.value.x = context.drawingBufferWidth;
	rayTracingUniforms.uResolution.value.y = context.drawingBufferHeight;

	rayTracingRenderTarget.setSize(context.drawingBufferWidth, context.drawingBufferHeight);
	screenCopyRenderTarget.setSize(context.drawingBufferWidth, context.drawingBufferHeight);

	worldCamera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	// the following is normally used with traditional rasterized rendering, but it is not needed for our fragment shader raytraced rendering 
	//worldCamera.updateProjectionMatrix();

	// the following scales all scene objects by the worldCamera's field of view,
	// taking into account the screen aspect ratio and multiplying the uniform uULen,
	// the x-coordinate, by this ratio
	fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
	rayTracingUniforms.uVLen.value = Math.tan(fovScale);
	rayTracingUniforms.uULen.value = rayTracingUniforms.uVLen.value * worldCamera.aspect;

} // end function onWindowResize( event )

function initTHREEjs()
{
	let canvas = document.createElement('canvas');

	renderer = new THREE.WebGLRenderer({ canvas: canvas, context: canvas.getContext('webgl2') });
	//suggestion: set to false for production
	renderer.debug.checkShaderErrors = true;

	renderer.autoClear = false;

	renderer.toneMapping = THREE.ReinhardToneMapping;

	//required by WebGL 2.0 for rendering to FLOAT textures
   context = renderer.getContext();
	context.getExtension('EXT_color_buffer_float');
   document.getElementById("webgl-output").appendChild(renderer.domElement);

   clock = new THREE.Timer();
         
	rayTracingScene = new THREE.Scene();
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
	rayTracingScene.add(worldCamera);

   // Set camera
	worldCamera.position.set(0, 4, 20);

   let orbit = new OrbitControls( worldCamera, renderer.domElement );
   orbit.addEventListener( 'change', 
      () => orbitMoved = true
   );

	// setup render targets...
	rayTracingRenderTarget = new THREE.WebGLRenderTarget(context.drawingBufferWidth, context.drawingBufferHeight, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: false,
		stencilBuffer: false
	});
	rayTracingRenderTarget.texture.generateMipmaps = false;

	screenCopyRenderTarget = new THREE.WebGLRenderTarget(context.drawingBufferWidth, context.drawingBufferHeight, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: false,
		stencilBuffer: false
	});
	screenCopyRenderTarget.texture.generateMipmaps = false;

	// setup screen-size quad geometry and shaders....
	// this full-screen quad mesh performs the ray tracing operations and produces a screen-sized image
	rayTracingGeometry = new THREE.PlaneGeometry(2, 2);

	rayTracingUniforms.uPreviousTexture = { type: "t", value: screenCopyRenderTarget.texture };
	rayTracingUniforms.uBlueNoiseTexture = { type: "t", value: blueNoiseTexture };
	rayTracingUniforms.uCameraMatrix = { type: "m4", value: new THREE.Matrix4() };
   rayTracingUniforms.uResolution = { type: "v2", value: new THREE.Vector2() };
	rayTracingUniforms.uRandomVec2 = { type: "v2", value: new THREE.Vector2() };
   rayTracingUniforms.uEPS_intersect = { type: "f", value: EPS_intersect };
	rayTracingUniforms.uTime = { type: "f", value: 0.0 };
	rayTracingUniforms.uSampleCounter = { type: "f", value: 0.0 };
	rayTracingUniforms.uPreviousSampleCount = { type: "f", value: 1.0 };
	rayTracingUniforms.uFrameCounter = { type: "f", value: 1.0 };
	rayTracingUniforms.uULen = { type: "f", value: 1.0 };
	rayTracingUniforms.uVLen = { type: "f", value: 1.0 };
	rayTracingUniforms.uApertureSize = { type: "f", value: apertureSize };
	rayTracingUniforms.uFocusDistance = { type: "f", value: focusDistance };
	rayTracingUniforms.uSceneIsDynamic = { type: "b1", value: sceneIsDynamic };
	rayTracingUniforms.uCameraIsMoving = { type: "b1", value: false };
	rayTracingUniforms.uUseOrthographicCamera = { type: "b1", value: false };

	rayTracingDefines = {
		//NUMBER_OF_TRIANGLES: total_number_of_triangles
	};

	// load vertex and fragment shader files that are used in the rayTracing material, mesh and scene
   var fileLoader = new THREE.FileLoader();
	fileLoader.load('../libs/rayTracing/shaders/CommonRayTracing_Vertex.glsl', function(vertexShaderText)
	{
		rayTracingVertexShader = vertexShaderText;

		fileLoader.load('../libs/rayTracing/shaders/_rayTracingGLSL01.glsl', function(fragmentShaderText)
		{
			rayTracingFragmentShader = fragmentShaderText;
			rayTracingMaterial = new THREE.ShaderMaterial({
				uniforms: rayTracingUniforms,
				uniformsGroups: rayTracingUniformsGroups,
				defines: rayTracingDefines,
				vertexShader: rayTracingVertexShader,
				fragmentShader: rayTracingFragmentShader,
				depthTest: false,
				depthWrite: false
			});

			rayTracingMesh = new THREE.Mesh(rayTracingGeometry, rayTracingMaterial);
			rayTracingScene.add(rayTracingMesh);

			// the following keeps the large scene ShaderMaterial quad right in front 
			//   of the camera at all times. This is necessary because without it, the scene 
			//   quad will fall out of view and get clipped when the camera rotates past 180 degrees.
			worldCamera.add(rayTracingMesh);

		});
	});

	// this full-screen quad mesh copies the image output of the raytracing shader and feeds it back in to that shader as a 'previousTexture'
	screenCopyGeometry = new THREE.PlaneGeometry(2, 2);

	screenCopyUniforms = {
		uRayTracedImageTexture: { type: "t", value: rayTracingRenderTarget.texture }
	};

	fileLoader.load('../libs/rayTracing/shaders/ScreenCopy_Fragment.glsl', function(shaderText)
	{
		screenCopyFragmentShader = shaderText;
		screenCopyMaterial = new THREE.ShaderMaterial({
			uniforms: screenCopyUniforms,
			vertexShader: rayTracingVertexShader,
			fragmentShader: screenCopyFragmentShader,
			depthWrite: false,
			depthTest: false
		});
		screenCopyMesh = new THREE.Mesh(screenCopyGeometry, screenCopyMaterial);
		screenCopyScene.add(screenCopyMesh);
	});

	// this full-screen quad mesh takes the image output of the ray tracing shader (which is a continuous blend of the previous frame and current frame),
	// and applies gamma correction (which brightens the entire image), and then displays the final accumulated rendering to the screen
	screenOutputGeometry = new THREE.PlaneGeometry(2, 2);

	screenOutputUniforms = {
		uRayTracedImageTexture: { type: "t", value: rayTracingRenderTarget.texture },
		uOneOverSampleCounter: { type: "f", value: 0.0 },
		uUseToneMapping: { type: "b1", value: useToneMapping }
	};

	fileLoader.load('../libs/rayTracing/shaders/ScreenOutput_Fragment.glsl', function(shaderText)
	{
		screenOutputFragmentShader = shaderText;

		screenOutputMaterial = new THREE.ShaderMaterial({
			uniforms: screenOutputUniforms,
			vertexShader: rayTracingVertexShader,
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

// called automatically from within initTHREEjs() function (located in InitCommon.js file)
export function initSceneData() 
{
	//demoFragmentShaderFileName = '../libs/rayTracing/shaders/_rayTracingGLSL01.glsl';

   //------------------------------------------------------------------------------------
	// ClearCoat checkered ground rectangle
	groundRectangle = new RayTracingShape("rectangle");

	groundRectangle.material.color.set(1.0, 1.0, 1.0); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	groundRectangle.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	groundRectangle.material.ior = 1.4; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	groundRectangle.material.clearcoat = 1.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	groundRectangle.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	groundRectangle.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	//groundRectangle.uvScale.set(30, 30); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	groundRectangle.transform.scale.set(60, 60, 1); 
	groundRectangle.transform.rotation.set(Math.PI * -0.5, 0, 0);
	groundRectangle.transform.updateMatrixWorld(true); 

 
   //------------------------------------------------------------------------------------
	// ClearCoat checkered box
	box = new RayTracingShape("box");

	box.material.color.set(1.0, 1.0, 1.0); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	box.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	box.material.ior = 1.0; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	box.material.clearcoat = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	box.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	box.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	box.uvScale.set(1, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	box.transform.scale.set(2, 2, 4);
	box.transform.position.set(4, 2.01, -18);
	box.transform.rotation.set(0, -0.8, 0);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	box.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last

   //------------------------------------------------------------------------------------
	// diffuse sphere
	diffuseSphere = new RayTracingShape("sphere");
	diffuseSphere.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	diffuseSphere.material.ior = 1.5; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	diffuseSphere.material.clearcoat = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	diffuseSphere.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	diffuseSphere.material.roughness = 1.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	diffuseSphere.uvScale.set(1, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	diffuseSphere.transform.scale.set(2, 2, 2);
	diffuseSphere.transform.position.set(16, 2, -1.5);
	//diffuseSphere.transform.rotation.set(0, 0, Math.PI * 0.25);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	diffuseSphere.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last
	
   //------------------------------------------------------------------------------------
	// metal sphere
	metalSphere = new RayTracingShape("sphere");

	metalSphere.material.color.set(1.000, 0.766, 0.336); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	metalSphere.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	metalSphere.material.ior = 1.5; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	metalSphere.material.clearcoat = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	metalSphere.material.metalness = 1.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	metalSphere.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	metalSphere.uvScale.set(1, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	metalSphere.transform.scale.set(4, 4, 4);
	metalSphere.transform.position.set(12, 4, -9);
	//metalSphere.transform.rotation.set(0, 0, Math.PI * 0.25);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	metalSphere.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last
	
   //------------------------------------------------------------------------------------
	// clearcoat sphere with uvGrid texture applied
	coatSphere = new RayTracingShape("sphere");

	coatSphere.material.color.set(1.0, 1.0, 1.0); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	coatSphere.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	coatSphere.material.ior = 1.4; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	coatSphere.material.clearcoat = 1.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	coatSphere.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	coatSphere.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	coatSphere.uvScale.set(2, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	coatSphere.transform.scale.set(4, 4, 4);
	coatSphere.transform.position.set(0, 4, -4);
	//coatSphere.transform.rotation.set(0, 0, Math.PI * 0.25);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	coatSphere.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last
	///shearMatrix.makeShear(1, 0, 0, 0, 0, 0); // parameters are (y_by_x, z_by_x, x_by_y, z_by_y, x_by_z, y_by_z)
	///coatSphere.transform.matrixWorld.multiply(shearMatrix); // multiply this shape's matrix by the shear matrix4
	// note: don't do another call to updateMatrixWorld(), because it would wipe out the scale, position, and rotation values that we changed earlier

   //------------------------------------------------------------------------------------
	// glass sphere
	glassSphere = new RayTracingShape("sphere");

	glassSphere.material.color.set(0.4, 1.0, 0.6); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	glassSphere.material.opacity = 0.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	glassSphere.material.ior = 1.5; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	glassSphere.material.clearcoat = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	glassSphere.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	glassSphere.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	glassSphere.uvScale.set(1, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	glassSphere.transform.scale.set(4, 4, 4);
	glassSphere.transform.position.set(-14, 4, -5);
	//glassSphere.transform.rotation.set(0, 0, Math.PI * 0.25);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	glassSphere.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last
	
   //------------------------------------------------------------------------------------
	// clearcoat cylinder
	cylinder = new RayTracingShape("cylinder");

	cylinder.material.color.set(1.0, 1.0, 1.0); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	cylinder.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	cylinder.material.ior = 2.3; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	cylinder.material.clearcoat = 1.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	cylinder.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	cylinder.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	cylinder.uvScale.set(2, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	cylinder.transform.scale.set(3, 5, 3);
	cylinder.transform.position.set(-8, 5, -12);
	//cylinder.transform.rotation.set(0, 0, Math.PI * 0.25);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	cylinder.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last
	
	// checkered clearcoat cone
	cone = new RayTracingShape("cone");

	cone.material.color.set(1.0, 1.0, 1.0); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	cone.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	cone.material.ior = 1.4; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	cone.material.clearcoat = 1.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	cone.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	cone.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	cone.uvScale.set(2, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	cone.transform.scale.set(2, 2, 2);
	cone.transform.position.set(-10.5, 2, 4);
	//cone.transform.rotation.set(0, 0, Math.PI * 0.25);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	cone.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last
	

	// checkered clearcoat capped cone
	cappedCone = new RayTracingShape("capped cone");

	cappedCone.material.color.set(1.0, 1.0, 1.0); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	cappedCone.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	cappedCone.material.ior = 1.3; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	cappedCone.material.clearcoat = 1.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	cappedCone.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	cappedCone.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	cappedCone.uvScale.set(2, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	cappedCone.transform.scale.set(2, 2, 2);
	cappedCone.transform.position.set(-17, 1.46, 4);
	cappedCone.transform.rotation.set(0, 0, Math.PI * 0.577);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	cappedCone.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last
	

	//checkered clearcoat paraboloid
	paraboloid = new RayTracingShape("paraboloid");

	paraboloid.material.color.set(1.0, 1.0, 1.0); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	paraboloid.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	paraboloid.material.ior = 1.4; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	paraboloid.material.clearcoat = 1.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	paraboloid.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	paraboloid.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	paraboloid.uvScale.set(2, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	paraboloid.transform.scale.set(2, 2, 2);
	paraboloid.transform.position.set(-3.5, 2, 4);
	//paraboloid.transform.rotation.set(0, 0, Math.PI * 0.25);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	paraboloid.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last
	

	// checkered clearcoat hyperboloid
	hyperboloid = new RayTracingShape("hyperboloid");

	hyperboloid.material.color.set(1.0, 1.0, 1.0); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	hyperboloid.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	hyperboloid.material.ior = 1.4; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	hyperboloid.material.clearcoat = 1.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	hyperboloid.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	hyperboloid.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	hyperboloid.uvScale.set(2, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	hyperboloid.transform.scale.set(2, 2, 2);
	hyperboloid.transform.position.set(3.5, 2, 4);
	//hyperboloid.transform.rotation.set(0, 0, Math.PI * 0.25);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	hyperboloid.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last
	

	// checkered clearcoat hyperbolic paraboloid
	hyperbolicParaboloid = new RayTracingShape("hyperbolic paraboloid");

	hyperbolicParaboloid.material.color.set(1.0, 1.0, 1.0); // (r,g,b) range: 0.0 to 1.0 / default is rgb(1,1,1) white
	hyperbolicParaboloid.material.opacity = 1.0; // range: 0.0 to 1.0 / default is 1.0 (fully opaque)
	hyperbolicParaboloid.material.ior = 1.4; // range: 1.0(air) to 2.33(diamond) / default is 1.5(glass) / other useful ior is 1.33(water)
	hyperbolicParaboloid.material.clearcoat = 1.0; // range: 0.0 to 1.0 / default is 0.0 (no clearcoat)
	hyperbolicParaboloid.material.metalness = 0.0; // range: either 0.0 or 1.0 / default is 0.0 (not metal)
	hyperbolicParaboloid.material.roughness = 0.0; // range: 0.0 to 1.0 / default is 0.0 (no roughness, perfectly smooth)

	hyperbolicParaboloid.uvScale.set(2, 1); // if checkered or using a texture, how many times should the uv's repeat in the X axis / Y axis?

	hyperbolicParaboloid.transform.scale.set(2, 2, 2);
	hyperbolicParaboloid.transform.position.set(11, 2, 4);
	//hyperbolicParaboloid.transform.rotation.set(0, 0, Math.PI * 0.25);
	// after specifying any desired transforms (scale, position, rotation), we must call updateMatrixWorld() to actually fill in the shape's matrix with these new values
	hyperbolicParaboloid.transform.updateMatrixWorld(true); // 'true' forces a matrix update now, rather than waiting for Three.js' 'renderer.render()' call which happens last

   // let textureLoader = new THREE.TextureLoader();
   // UVGridTexture = textureLoader.load('textures/uvgrid0.png', 
   //    () => {flipY: false; wrapS: THREE.ClampToEdgeWrapping; wrapT: THREE.ClampToEdgeWrapping}); 

   let textureLoader = new THREE.TextureLoader();
   UVGridTexture = textureLoader.load(
      '../libs/rayTracing/textures/uvgrid0.png',
      ()=>{
         UVGridTexture.wrapS = THREE.RepeatWrapping;
         UVGridTexture.wrapT = THREE.RepeatWrapping;
         UVGridTexture.flipY = false;
      }
   );

	// In addition to the default GUI on all demos, add any special GUI elements that this particular demo requires
	
	// scene/demo-specific uniforms go here     
	rayTracingUniforms.uUVGridTexture = { value: UVGridTexture };
	rayTracingUniforms.uRectangleInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uBoxInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uDiffuseSphereInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uMetalSphereInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uCoatSphereInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uGlassSphereInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uCylinderInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uConeInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uCappedConeInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uParaboloidInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uHyperboloidInvMatrix = { value: new THREE.Matrix4() };
	rayTracingUniforms.uHyperbolicParaboloidInvMatrix = { value: new THREE.Matrix4() };

	// copy each shape's inverse matrix over to the GPU as a uniform for use in the ray tracing shader.
	rayTracingUniforms.uRectangleInvMatrix.value.copy(groundRectangle.transform.matrixWorld).invert();
	rayTracingUniforms.uBoxInvMatrix.value.copy(box.transform.matrixWorld).invert();
	rayTracingUniforms.uDiffuseSphereInvMatrix.value.copy(diffuseSphere.transform.matrixWorld).invert();
	rayTracingUniforms.uMetalSphereInvMatrix.value.copy(metalSphere.transform.matrixWorld).invert();
	rayTracingUniforms.uCoatSphereInvMatrix.value.copy(coatSphere.transform.matrixWorld).invert();
	rayTracingUniforms.uGlassSphereInvMatrix.value.copy(glassSphere.transform.matrixWorld).invert();
	rayTracingUniforms.uCylinderInvMatrix.value.copy(cylinder.transform.matrixWorld).invert();
	rayTracingUniforms.uConeInvMatrix.value.copy(cone.transform.matrixWorld).invert();
	rayTracingUniforms.uCappedConeInvMatrix.value.copy(cappedCone.transform.matrixWorld).invert();
	rayTracingUniforms.uParaboloidInvMatrix.value.copy(paraboloid.transform.matrixWorld).invert();
	rayTracingUniforms.uHyperboloidInvMatrix.value.copy(hyperboloid.transform.matrixWorld).invert();
	rayTracingUniforms.uHyperbolicParaboloidInvMatrix.value.copy(hyperbolicParaboloid.transform.matrixWorld).invert();
} // end function initSceneData()

