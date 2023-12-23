import * as THREE from 'three';
import Stats from '../build/jsm/libs/stats.module.js';
import {PointerLockControls} from '../build/jsm/controls/PointerLockControls.js';
import {initRenderer,
        initDefaultBasicLight,
        onWindowResize} from "../libs/util/util.js";

var stats = new Stats();          // To show FPS information
var renderer = initRenderer("rgb(70, 150, 240)");    // View function in util/utils

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-5, 2, -5);
camera.lookAt(new THREE.Vector3(0, 2, 0));
scene.add(camera);

const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0).normalize(), 0, 2);
initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// Loading all textures
const loader = new THREE.TextureLoader();

const groundTexture = loader.load('../assets/textures/wood.png');
groundTexture.colorSpace = THREE.SRGBColorSpace;
groundTexture.wrapS = THREE.MirroredRepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(8, 8);

const rampTexture = loader.load('../assets/textures/wood.png');
rampTexture.wrapS = THREE.MirroredRepeatWrapping;
rampTexture.repeat.set(2, 1);

const whiteWallTexture = loader.load('../assets/textures/stonewall.jpg');
whiteWallTexture.colorSpace = THREE.SRGBColorSpace;
whiteWallTexture.wrapS = THREE.MirroredRepeatWrapping;
whiteWallTexture.repeat.set(10, 1);

const whiteWallTexture2 = loader.load('../assets/textures/stonewall.jpg');
whiteWallTexture2.colorSpace = THREE.SRGBColorSpace;
whiteWallTexture2.wrapS = THREE.MirroredRepeatWrapping;
whiteWallTexture2.repeat.set(5, 1);

const brickWallTexture = loader.load('../assets/textures/stonewall.jpg');

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
const wallMaterial2 = new THREE.MeshBasicMaterial({
   map: whiteWallTexture2
});

const walls = [];

for (let i = 0; i < 3; i++) {
    walls.push(new THREE.Mesh(WallGeometry, wallMaterial));
}

walls.push(new THREE.Mesh(smallWallGeometry, wallMaterial2));
walls.push(new THREE.Mesh(smallWallGeometry, wallMaterial2));

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
