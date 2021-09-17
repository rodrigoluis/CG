import * as THREE from '../../build/three.module.js';
import { FlyControls } from '../../build/jsm/controls/FlyControls.js';

let clock = new THREE.Clock();
let flyCamera;

export function setFlyNonVRBehavior(camera, renderer)
{
    flyCamera = new FlyControls( camera, renderer.domElement );
    flyCamera.movementSpeed = 5;
    flyCamera.domElement = renderer.domElement;
    flyCamera.rollSpeed = 0.20;
}

export function updateFlyNonVRBehavior()
{
    const delta = clock.getDelta();    
    flyCamera.update(delta);    
}