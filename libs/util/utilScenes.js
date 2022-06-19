import * as THREE from  'three';
import {GLTFLoader} from '../../build/jsm/loaders/GLTFLoader.js';

export function loadLightPostScene(scene)
{
   // Light Post
   let loader = new GLTFLoader( );
   loader.load( '../../assets/objects/lightPost.glb', function ( gltf ) 
   {
      let obj = gltf.scene;
      obj.traverse( function ( child ) {
      if ( child ) {
            child.castShadow = true;
      }});

      obj.traverse( function( node ){
      if( node.material ) node.material.side = THREE.DoubleSide;
      });

      obj.scale.set(1.0, 0.5, 1.0)
      scene.add ( obj );
   }, null, null);

   // Ground plane
   let textureLoader = new THREE.TextureLoader();
   let floor = textureLoader.load('../../assets/textures/intertravado.jpg');
   let planeGeometry = new THREE.PlaneGeometry(15, 15, 80, 80);
   let planeMaterial = new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
   let groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
       groundPlane.receiveShadow = true;
       groundPlane.rotateX(-1.5708);
       groundPlane.material.map = floor;  
       groundPlane.material.map.wrapS = THREE.RepeatWrapping;
       groundPlane.material.map.wrapT = THREE.RepeatWrapping;       
       groundPlane.material.map.repeat.set(6,6); 

   scene.add(groundPlane);
}