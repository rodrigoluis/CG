import * as THREE from '../../build/three.module.js';
import { FlyControls } from '../../build/jsm/controls/FlyControls.js';

let clock = new THREE.Clock();
let flyCamera;
let lookCamera;

export function setFlyNonVRBehavior(camera, renderer)
{
    flyCamera = new FlyControls( camera, renderer.domElement );
    flyCamera.movementSpeed = 5;
    flyCamera.domElement = renderer.domElement;
    flyCamera.rollSpeed = 0.2;
}

export function updateFlyNonVRBehavior()
{
    const delta = clock.getDelta();    
    flyCamera.update(delta);    
}

export function setLookNonVRBehavior(camera, renderer)
{
    lookCamera = new FlyControls( camera, renderer.domElement );
    lookCamera.domElement = renderer.domElement;
    lookCamera.movementSpeed = 0; // Avoid moving
    lookCamera.rollSpeed = 0.3;
}

export function updateLookNonVRBehavior()
{
    const delta = clock.getDelta();    
    lookCamera.update(delta);    
}
