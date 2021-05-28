import * as THREE from  '../build/three.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {DragControls} from '../build/jsm/controls/DragControls.js'
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        initCamera,        
        initDefaultSpotlight,
        SecondaryBox,        
        createGroundPlane, 
        InfoBox,
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
scene.background = new THREE.Color(0xf0f0f0);

var renderer = initRenderer();
renderer.setClearColor("rgb(30, 30, 42)");

var camera = initCamera(new THREE.Vector3(0, -33, 15)); // Init camera in this position

initDefaultSpotlight(scene, new THREE.Vector3(30, -30, 30)); // Use default light

var groundPlane = createGroundPlane(40, 40, 100, 100);
scene.add(groundPlane);

// To use the keyboard
var keyboard = new KeyboardState();

// Show text information onscreen
showInformation();

// Create auxiliary info box
var infoBox = new SecondaryBox("Drag Control ON");

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement);

// Control if 'dragging' is on or off
var dragOn = true;

// Create list of objects
var objects = [];
var geometry = new THREE.BoxGeometry(4, 4, 4);    
for (let i = 0; i < 3; i++) {
    var object = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff }));
    object.castShadow = true;
    object.receiveShadow = true;

    object.position.set(8 * i - 8, 2 * i - 2, 2.0);

    scene.add(object);
    objects.push(object);
}

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

//-----------------------------------------------------------------------
// CREATE DRAG OBJECT
// Create the Drag Control object
var dragControl = new DragControls(objects, camera, renderer.domElement);

// add event listener to highlight dragged objects
dragControl.addEventListener('dragstart', function (event) {
    event.object.material.emissive.set(0x333333);
});

dragControl.addEventListener('dragend', function (event) {
    event.object.material.emissive.set(0x000000);
});

render();

function keyboardUpdate() {
    keyboard.update();
    if (keyboard.down("C")) dragOn = !dragOn;
}

function showInformation() {
    // Use this to show information onscreen
    var infoMessage = new InfoBox();
    infoMessage.add("Drag Example");
    infoMessage.addParagraph();
    infoMessage.add("Press 'C' to enable/disable drag option. When disable, you can rotate de scene.");
    infoMessage.show();
}

function render() {
    requestAnimationFrame(render);
    keyboardUpdate();
    if (dragOn) {
        dragControl.activate(); //
        trackballControls.enabled = false;
        infoBox.changeMessage("Drag Control ON");            
    }
    else {
        dragControl.deactivate();
        trackballControls.enabled = true;
        trackballControls.update();
        infoBox.changeMessage("Drag Control OFF");                
    }
    renderer.render(scene, camera);
}

