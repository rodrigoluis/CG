/**
 * Fogo volumétrico procedural para Three.js.
 * Os shaders GLSL são recebidos como strings pelo construtor.
 */
import * as THREE from 'three';

export default class Fire extends THREE.Mesh {
    constructor(fireTex, vertexShader, fragmentShader) {
        const uniforms = {
            fireTex:        { value: fireTex },
            color:          { value: new THREE.Color(0xffffff) },
            time:           { value: 0.0 },
            seed:           { value: 0.0 },
            invModelMatrix: { value: new THREE.Matrix4() },
            scale:          { value: new THREE.Vector3(1.0, 2.5, 1.0) },
            magnitude:      { value: 1.3 },
            lacunarity:     { value: 2.0 },
            gain:           { value: 0.5 }
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: true,
            depthTest: true
        });

        super(new THREE.BoxGeometry(1.0, 1.0, 1.0), material);
        this.fireScale = new THREE.Vector3(1.0, 2.5, 1.0);
    }

    setFileScale(value = new THREE.Vector3(1.0, 2.5, 1.0)) {
        this.fireScale.copy(value);
    }

    update(clock) {
        clock.update();
        const time = clock.getElapsed();

        this.updateMatrixWorld();
        this.material.uniforms.invModelMatrix.value
            .copy(this.matrixWorld)
            .invert();

        if (time !== undefined) {
            this.material.uniforms.time.value = time;
        }

        this.material.uniforms.scale.value.copy(this.fireScale);
    }
}
