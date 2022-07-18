import { initGeneral,
         initTHREEjs,
         animate,
         setMainValues} from '../libs/pathTracing/pathTracingConfig.js';

let dynamic = false;
let cameraFlightSpeed = 60;
let pixelRatio = 0.8;
let EPS_intersect = 0.01;
let focusDist = 130.0;

let noiseFile = '../libs/pathTracing/noise/blueNoise_RGBA256.png'
let pathTracingGLSL = '../libs/pathTracing/shaders/pathTracingExample1.glsl';
let commonGLSL = '../libs/pathTracing/shaders/pathTracing_Vertex.glsl';
let screenCpyGLSL = '../libs/pathTracing/shaders/screenCopy_Fragment.glsl';
let screenOutGLSL = '../libs/pathTracing/shaders/screenOutput_Fragment.glsl';

setMainValues(dynamic, cameraFlightSpeed, pixelRatio, EPS_intersect, focusDist, 
              noiseFile, pathTracingGLSL, commonGLSL, screenCpyGLSL, screenOutGLSL)

initGeneral(); 
initTHREEjs(); 
render();

function render()
{
   animate();
   requestAnimationFrame(render);
}
