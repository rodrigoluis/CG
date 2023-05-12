import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

import {
   initRenderer,
   initDefaultBasicLight,
   initCamera,
   createGroundPlaneXZ,
   onWindowResize
} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit; 
scene = new THREE.Scene();    
renderer = initRenderer();    
renderer.setClearColor("rgb(30, 30, 40)");
camera = initCamera(new THREE.Vector3(17, 10, 17));
orbit = new OrbitControls(camera, renderer.domElement);
light = initDefaultBasicLight(scene, true, new THREE.Vector3(15, 12, 10) );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlaneXZ(60, 60, 50, 50);
scene.add(groundPlane);

//-------------------------------------------------------------------
// Start setting the group
let car1 = buildCar();
    car1.rotateZ(THREE.MathUtils.degToRad(-90));
    car1.scale.set(0.5, 0.5, 0.5)

let car2 = car1.clone(); // Cloning the entire car

// Positioning the cars
car1.position.set(0.0, 1.6,  4.0);
car2.position.set(0.0, 1.6, -4.0);

scene.add(car1);
scene.add(car2);

render();

//-- Functions -----------------------------------------------------------------------------------

function setMaterial(inColor)
{
   return new THREE.MeshPhongMaterial({color: inColor, transparent: true});   
}

function criaCilindro(radiusTop, radiusBottom, height, color) {
   let geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height);
   let material = setMaterial(color);
   let object = new THREE.Mesh(geometry, material);
      object.castShadow = true;
   return object;
}

function criaRoda(radius, tube, radialSegments, tubularSegments, arc) {
   let geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
   let material = setMaterial("rgb(125,125,125)");
   let object = new THREE.Mesh(geometry, material);
      object.castShadow = true;
   return object;
}

function buildCar() {
   // Configura todas as partes do carro
   let body = criaCilindro(2.0, 2.7, 10.0, "rgb(230,120,50)");
   let roda1, roda2, eixo, eixo2;

   eixo = criaCilindro(0.3, 0.3, 7.0, "rgb(255,0,0)");
      roda1 = criaRoda(1.0, 0.3, 20, 20, Math.PI * 2);
      roda1.rotateX(THREE.MathUtils.degToRad(90));
      roda2 = roda1.clone(); // Clona roda já criada e rotacionada
      roda1.position.set(0.0, 3.5, 0.0);
      roda2.position.set(0.0, -3.5, 0.0);
   eixo.add(roda1);
   eixo.add(roda2);
   eixo.rotateX(THREE.MathUtils.degToRad(90));
   eixo2 = eixo.clone(); // Clona o eixo já rotacionado
   
   eixo.position.set(2.1, 4.0, 0.0);
   eixo2.position.set(2.1, -4.2, 0.0);

   body.add(eixo);
   body.add(eixo2);

   return body;
}

function render() {
   requestAnimationFrame(render);
   renderer.render(scene, camera);
}
