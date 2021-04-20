import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {PointerLockControls} from '../build/jsm/controls/PointerLockControls.js';
import {initRenderer,
        onWindowResize} from "../libs/util/util.js";

var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
    renderer.setClearColor(new THREE.Color(0xeeeeee));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-5, 2, -5);
camera.lookAt(new THREE.Vector3(0, 2, 0));
scene.add(camera);

const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0).normalize(), 0, 2);

const light = new THREE.DirectionalLight(0xfefefe);
light.position.set(100, 90, 100);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x442222);
scene.add(ambientLight);

// Loading all textures
const loader = new THREE.TextureLoader();

const groundTexture = loader.load('../assets/textures/floor-wood.jpg');
groundTexture.wrapS = THREE.MirroredRepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(20, 20);

const rampTexture = loader.load('../assets/textures/floor-wood.jpg');
rampTexture.wrapS = THREE.MirroredRepeatWrapping;
rampTexture.repeat.set(3, 1);

const whiteWallTexture = loader.load('../assets/textures/granite.png');
whiteWallTexture.wrapS = THREE.MirroredRepeatWrapping;
whiteWallTexture.repeat.set(10, 1);

const brickWallTexture = loader.load('../assets/textures/stone.jpg');

// End loading textures

const planeGeometry = new THREE.PlaneGeometry(50, 50, 5);
const planeMaterial = new THREE.MeshLambertMaterial({
    map: groundTexture
});
const ground = new THREE.Mesh(planeGeometry, planeMaterial);
ground.position.set(0, 0, 0);
ground.rotation.x = -0.5 * Math.PI;
scene.add(ground);

const boxGeometry = new THREE.BoxGeometry(50, 50, 0.5);
const ground2 = new THREE.Mesh(boxGeometry, planeMaterial);
ground2.position.set(58, 5, 0);
ground2.rotation.x = -0.5 * Math.PI;
scene.add(ground2);

const rampGeometry = new THREE.PlaneGeometry(11, 10);
const rampMaterial = new THREE.MeshLambertMaterial({
    map: rampTexture
});
const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
ramp.rotation.x = 1.5 * Math.PI;
ramp.rotation.y = -Math.PI / 6;
ramp.position.set(28.5, 2, 0);
scene.add(ramp);

const WallGeometry = new THREE.PlaneGeometry(50, 5);
const smallWallGeometry = new THREE.PlaneGeometry(20, 5);
const wallMaterial = new THREE.MeshBasicMaterial({
    map: whiteWallTexture
});
const walls = [];

for (let i = 0; i < 3; i++) {
    walls.push(new THREE.Mesh(WallGeometry, wallMaterial));
}

walls.push(new THREE.Mesh(smallWallGeometry, wallMaterial));
walls.push(new THREE.Mesh(smallWallGeometry, wallMaterial));

walls[0].position.set(0, 2.5, -25);

walls[1].position.set(0, 2.5, 25);
walls[1].rotation.y = Math.PI;

walls[2].position.set(-25, 2.5, 0);
walls[2].rotation.y = Math.PI / 2;

walls[3].position.set(25, 2.5, 15);
walls[3].rotation.y = Math.PI / -2;

walls[4].position.set(25, 2.5, -15);
walls[4].rotation.y = Math.PI / -2;

walls.forEach(wall => scene.add(wall));

const brickWallGeometry = new THREE.PlaneGeometry(8.5, 5);
const brickWallMaterial = new THREE.MeshBasicMaterial({
    map: brickWallTexture
});
const brickWalls = [];

brickWalls.push(new THREE.Mesh(brickWallGeometry, brickWallMaterial));
brickWalls.push(new THREE.Mesh(brickWallGeometry, brickWallMaterial));

brickWalls[0].position.set(29, 2.5, -5);
brickWalls[1].position.set(29, 2.5, 5);
brickWalls[1].rotation.y = Math.PI;

brickWalls.forEach(brickWall => scene.add(brickWall));

const paintingGeometry = new THREE.PlaneGeometry(4, 3);
const paintings = [
    new THREE.Mesh(paintingGeometry, new THREE.MeshBasicMaterial({ map: loader.load('../assets/textures/fishermen.png') })),
    new THREE.Mesh(paintingGeometry, new THREE.MeshBasicMaterial({ map: loader.load('../assets/textures/fishermen.png') })),
    new THREE.Mesh(paintingGeometry, new THREE.MeshBasicMaterial({ map: loader.load('../assets/textures/floor-wood.jpg') })),
    new THREE.Mesh(paintingGeometry, new THREE.MeshBasicMaterial({ map: loader.load('../assets/textures/glass.png') })),
    new THREE.Mesh(paintingGeometry, new THREE.MeshBasicMaterial({ map: loader.load('../assets/textures/granite.png') })),
    new THREE.Mesh(paintingGeometry, new THREE.MeshBasicMaterial({ map: loader.load('../assets/textures/marble.png') })),
    new THREE.Mesh(paintingGeometry, new THREE.MeshBasicMaterial({ map: loader.load('../assets/textures/paper.png') })),
    new THREE.Mesh(paintingGeometry, new THREE.MeshBasicMaterial({ map: loader.load('../assets/textures/sand.jpg') })),
];

paintings[0].position.set(-12.5, 2.5, -24.9);
paintings[1].position.set(12.5, 2.5, -24.9);

paintings[2].position.set(-12.5, 2.5, 24.9);
paintings[3].position.set(12.5, 2.5, 24.9);
paintings[2].rotation.y = Math.PI;
paintings[3].rotation.y = Math.PI;

paintings[4].position.set(-24.9, 2.5, -12.5);
paintings[5].position.set(-24.9, 2.5, 12.5);
paintings[4].rotation.y = Math.PI / 2;
paintings[5].rotation.y = Math.PI / 2;

paintings[6].position.set(24.9, 2.5, -12.5);
paintings[7].position.set(24.9, 2.5, 12.5);
paintings[6].rotation.y = Math.PI / -2;
paintings[7].rotation.y = Math.PI / -2;

paintings.forEach(p => scene.add(p));

const controls = new PointerLockControls(camera, renderer.domElement);

const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');

instructions.addEventListener('click', function () {

    controls.lock();

}, false);

controls.addEventListener('lock', function () {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
});

controls.addEventListener('unlock', function () {
    blocker.style.display = 'block';
    instructions.style.display = '';
});

scene.add(controls.getObject());

const speed = 20;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

window.addEventListener('keydown', (event) => movementControls(event.keyCode, true));
window.addEventListener('keyup', (event) => movementControls(event.keyCode, false));

function movementControls(key, value) {
    switch (key) {
        case 87: // W
            moveForward = value;
            break;
        case 83: // S
            moveBackward = value;
            break;
        case 65: // A
            moveLeft = value;
            break;
        case 68: // D
            moveRight = value;
            break;
        case 32:
            moveUp = value;
            break;
        case 16:
            moveDown = value;
            break;
    }
}

function moveAnimate(delta) {
    raycaster.ray.origin.copy(controls.getObject().position);
    const isIntersectingGround = raycaster.intersectObjects([ground, ground2]).length > 0;
    const isIntersectingRamp = raycaster.intersectObject(ramp).length > 0;

    if (moveForward) {
        controls.moveForward(speed * delta);
    }
    else if (moveBackward) {
        controls.moveForward(speed * -1 * delta);
    }

    if (moveRight) {
        controls.moveRight(speed * delta);
    }
    else if (moveLeft) {
        controls.moveRight(speed * -1 * delta);
    }

    if (moveUp && camera.position.y <= 100) {
        camera.position.y += speed * delta;
    }
    else if (moveDown && !isIntersectingGround && !isIntersectingRamp) {
        camera.position.y -= speed * delta;
    }
    else if (isIntersectingRamp) {
        camera.position.y += speed / 2 * delta;
    }
}

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

const clock = new THREE.Clock();
render();
function render() {
    stats.update();

    if (controls.isLocked) {
        moveAnimate(clock.getDelta());
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
