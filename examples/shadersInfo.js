
import * as THREE from 'three';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        onWindowResize} from "../libs/util/util.js";

let scene, renderer, camera, light; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
camera = initCamera(new THREE.Vector3(0, 0, 40)); // Init camera in this position
scene.add(camera); // Add camera to the scene
//orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Objeto demonstrativo
const geometry = new THREE.TorusKnotGeometry( 5, 1.5, 200, 50 );
const material = new THREE.MeshPhongMaterial( {color: "red", specular: "rgb(255,255,255)", shininess: 256} );
const object = new THREE.Mesh( geometry, material );
scene.add( object );

// Contêiner com rolagem
const panelContainer = document.createElement('div');

Object.assign(panelContainer.style, {
    position: 'fixed',
    top: '10px',
    left: '10px',
    maxWidth: 'calc(100vw - 20px)',
    maxHeight: 'calc(100vh - 20px)',
    overflow: 'auto',
    zIndex: '10',
    background: 'rgba(0,0,0,0.85)',
    pointerEvents: 'auto'
});

document.body.appendChild(panelContainer);

// Painel textual sobre o render
const panel = document.createElement('pre');

Object.assign(panel.style, {
    margin: '0',
    padding: '12px',
    color: '#b8ffb8',
    font: '14px monospace',
    whiteSpace: 'pre',
    width: 'max-content',
    minWidth: '0',
    boxSizing: 'border-box'
});

panelContainer.appendChild(panel);

//-------------------------------------------------
// Área para o link de pesquisa da GPU
const gpuLink = document.createElement("a");

gpuLink.textContent = "Pesquisar especificações da GPU";
gpuLink.href = "#";
gpuLink.target = "_blank";
gpuLink.rel = "noopener noreferrer";

gpuLink.style.display = "block";
gpuLink.style.marginTop = "8px";
gpuLink.style.color = "#66b3ff";
gpuLink.style.textDecoration = "underline";
gpuLink.style.cursor = "pointer";

panelContainer.appendChild(gpuLink);
//-------------------------------------------------

// Informações da GPU
const gl = renderer.getContext();
const debug = gl.getExtension('WEBGL_debug_renderer_info');

//-------------------------------------------------

let rendererName = "Não identificado";

if (debug) {
    rendererName = gl.getParameter(
        debug.UNMASKED_RENDERER_WEBGL
    );
}

function getParameter(parameter) {
    try {
        return gl.getParameter(parameter);
    } catch {
        return 'Indisponível';
    }
}

const gpuVendor = debug
    ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
    : 'Oculto ou não disponível';

const gpuRenderer = debug
    ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
    : 'Oculto ou não disponível';

const info = renderer.info;
const caps = renderer.capabilities;


function updatePanel(fps) {
    panel.textContent =
`INFORMAÇÕES DA GPU / THREE.JS
========================================
Fabricante informado: ${gpuVendor}
GPU / Renderer:       ${gpuRenderer}

API gráfica:          WebGL ${gl.getParameter(gl.VERSION)}
GLSL:                 ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}
Vendor WebGL:         ${getParameter(gl.VENDOR)}
Renderer WebGL:       ${getParameter(gl.RENDERER)}

CAPACIDADES GRÁFICAS
========================================
Textura máxima:       ${caps.maxTextureSize} x ${caps.maxTextureSize}
Texturas por shader:  ${caps.maxTextures}
Atributos de vértice: ${caps.maxAttributes}
Varyings:             ${caps.maxVaryings}
Uniforms no vertex:   ${caps.maxVertexUniforms}
Uniforms no fragment: ${caps.maxFragmentUniforms}
MSAA samples máx.:    ${caps.maxSamples}
Anisotropia máxima:   ${renderer.capabilities.getMaxAnisotropy()}

RENDERIZAÇÃO
========================================
Resolução do canvas:  ${renderer.domElement.width} x ${renderer.domElement.height}
Pixel ratio:          ${renderer.getPixelRatio().toFixed(2)}
FPS aproximado:       ${fps}
Draw calls:           ${info.render.calls}
Triângulos:           ${info.render.triangles}
Geometrias ativas:    ${info.memory.geometries}
Texturas ativas:      ${info.memory.textures}

Informações da GPU não expostas no Javascript/three.js no link abaixo 
(estimativa - não há garantia que as informações estejam corretas).`;
}

// Configura o link de pesquisa da GPU
const searchQuery = encodeURIComponent(rendererName + " specifications");
gpuLink.href = "https://www.google.com/search?q=" + searchQuery;

// Animação e FPS
let frames = 0;
let lastTime = performance.now();
let fps = 0;

render();
function render(now)
{
    requestAnimationFrame(render);

    frames++;

    if (now - lastTime >= 1000) {
        fps = Math.round(frames * 1000 / (now - lastTime));
        frames = 0;
        lastTime = now;
        updatePanel(fps);
    }

    object.rotation.y += 0.005;
    object.rotation.x += 0.002;

    renderer.render(scene, camera);
}
