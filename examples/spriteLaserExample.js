import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

//let scene, material;
let scene = new THREE.Scene();    // Create main scene
//renderer = initRenderer();    // Init a basic renderer

//light = initDefaultBasicLight(scene); // Create a basic light to 

//illuminate the scene
// camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
// scene.add(camera); // Add camera to the scene
//rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );


// ============================
// Cena básica
// ============================
//const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

let orbit = new OrbitControls( camera ); // Enable mouse 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ============================
// Textura do tiro (laser)
// ============================
// Você pode trocar por uma imagem externa se quiser
function createLaserTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');

  // gradiente vertical (laser)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
  gradient.addColorStop(0.5, 'rgba(0,200,255,1)');
  gradient.addColorStop(0.8, 'rgba(0,255,255,1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return new THREE.CanvasTexture(canvas);
}

const laserTexture = createLaserTexture();

// ============================
// Lista de tiros
// ============================
const bullets = [];

// ============================
// Função para disparar
// ============================
function shoot() {
  const material = new THREE.SpriteMaterial({
    map: laserTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    //depthWrite: false
  });

//   const sprite = new THREE.Sprite(material);

//   // escala (formato alongado)
//   sprite.scale.set(0.2, 2.2, 1);

//   // posição inicial (na frente da câmera)
//   sprite.position.copy(camera.position);
//   sprite.position.z -= 1.5;
//   sprite.rotateY(THREE.MathUtils.degToRad(90))

//   // direção: eixo Z negativo
//   const direction = new THREE.Vector3(0, 0, -1);
const geometry = new THREE.PlaneGeometry(0.3, 3.5);
const material2 = new THREE.MeshBasicMaterial({
  map: laserTexture,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide
});

   const direction = new THREE.Vector3(0, 0, -1);

const mesh2 = new THREE.Mesh(geometry, material2);
mesh2.rotateX(THREE.MathUtils.degToRad(-90))

  bullets.push({
    mesh: mesh2,
    velocity: direction.multiplyScalar(0.5),
    life: 0
  });

  scene.add(mesh2);
}

// ============================
// Disparo ao clicar
// ============================
window.addEventListener('click', shoot);

// ============================
// Resize
// ============================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


render();


render();
function render()
{
  requestAnimationFrame(render);

  // atualizar tiros
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    b.mesh.position.add(b.velocity);
    b.life++;

    // remover após um tempo
    if (b.life > 200) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}