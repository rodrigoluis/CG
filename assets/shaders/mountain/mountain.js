import * as THREE from 'three';

export default class Mountain extends THREE.Mesh {
    constructor(vertexShader, fragmentShader) {
        const geometry = new THREE.PlaneGeometry(6, 6, 100, 100);
        geometry.rotateX(-Math.PI / 2);

        // Cria quatro picos usando funções gaussianas.
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            const peak1 = 2.2 * Math.exp(-((x + 1.5) ** 2 + (z + 0.3) ** 2) / 1.0);
            const peak2 = 1.7 * Math.exp(-((x - 0.4) ** 2 + (z - 0.5) ** 2) / 0.8);
            const peak3 = 2.5 * Math.exp(-((x - 1.8) ** 2 + (z + 1.0) ** 2) / 0.7);
            const peak4 = 1.3 * Math.exp(-((x + 0.2) ** 2 + (z - 1.7) ** 2) / 0.7);

            positions.setY(i, peak1 + peak2 + peak3 + peak4);
        }
        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        const material = new THREE.ShaderMaterial({
            vertexShader, 
            fragmentShader, 
            side: THREE.DoubleSide
         });

        super(geometry, material);
    }
}
