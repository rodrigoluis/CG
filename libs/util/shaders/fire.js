/**
 * @author     mattatz        https://github.com/mattatz
 * Refactoring rodrigoluis    https://github.com/rodrigoluis
 * Ray tracing based real-time procedural volumetric fire object for three.js
 */

import * as THREE from 'three';
import FireShader from './fireShader.js'

export default class Fire extends THREE.Mesh {
   constructor(fireTex) { 
      var fireMaterial = new THREE.ShaderMaterial({
         defines: FireShader.defines,
         uniforms: THREE.UniformsUtils.clone(FireShader.uniforms),
         vertexShader: FireShader.vertexShader,
         fragmentShader: FireShader.fragmentShader,
         transparent: true,
         depthWrite: true,
         depthTest: true
      });

      // initialize uniforms 
      fireMaterial.uniforms.fireTex.value = fireTex;
      fireMaterial.uniforms.invModelMatrix.value = new THREE.Matrix4();

      super(new THREE.BoxGeometry(1.0, 1.0, 1.0), fireMaterial);
      this.setFileScale()
   }

   setFileScale(value = new THREE.Vector3(1.0, 2.5, 1.0))
   {
      this.fireScale = value;
   }

   update(clock) {
      clock.getDelta();
      var time = clock.elapsedTime;

      var invModelMatrix = this.material.uniforms.invModelMatrix.value;
      this.updateMatrixWorld();
      invModelMatrix.copy(this.matrixWorld).invert();

      if (time !== undefined) {
         this.material.uniforms.time.value = time;
      }

      this.material.uniforms.invModelMatrix.value = invModelMatrix;
      this.material.uniforms.scale.value = this.fireScale;
   };
};
