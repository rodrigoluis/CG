import * as THREE from '../../build/three.module.js';
import { FlyControls } from '../../build/jsm/controls/FlyControls.js';
import { InfoBox, } from "../../libs/util/util.js";

let clock = new THREE.Clock();
let flyCamera;
let lookCamera;

function showMessages(message1, message2)
{
    // Use this to show information onscreen
    var controls = new InfoBox();
        controls.add(message1);
        if(message2) controls.add(message2);        
    controls.show();     
}

export function setFlyNonVRBehavior(camera, renderer, message1, message2 = null)
{
    flyCamera = new FlyControls( camera, renderer.domElement );
    flyCamera.movementSpeed = 5;
    flyCamera.domElement = renderer.domElement;
    flyCamera.rollSpeed = 0.2;

    showMessages(message1, message2);
}

export function updateFlyNonVRBehavior()
{
    const delta = clock.getDelta();    
    flyCamera.update(delta);    
}

export function setLookNonVRBehavior(camera, renderer, message1, message2 = null)
{
    lookCamera = new FlyControls( camera, renderer.domElement );
    lookCamera.domElement = renderer.domElement;
    lookCamera.movementSpeed = 0; // Avoid moving
    lookCamera.rollSpeed = 0.3;

    showMessages(message1, message2);  
}

export function updateLookNonVRBehavior()
{
    const delta = clock.getDelta();    
    lookCamera.update(delta);    
}
