import * as THREE from '../../build/three.module.js';

export default class Grid extends THREE.LineSegments {
	constructor(width = 10, height = 10, divWidth = 10, divHeight = 10, color = "white", lineWidth = 1) {

		let k, step;
		let vertices = [];
      let halfSizeW = width / 2;
		let halfSizeH = height / 2;      

      // Desenha linhas perpendiculares ao eixo X
      step = width / divWidth;
      for (k = -halfSizeW; k <= halfSizeW; k += step) 
         vertices.push(k, -halfSizeH, 0, k, halfSizeH, 0);

      // Desenha linhas perpendiculares ao eixo Y
      step = height / divHeight;      
      for (k = -halfSizeH; k <= halfSizeH; k += step) 
         vertices.push(-halfSizeW, k, 0, halfSizeW, k, 0);
    
		let geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		let material = new THREE.LineBasicMaterial({
         color: new THREE.Color(color),
         linewidth: lineWidth
		});
		super(geometry, material);
		this.type = 'Grid';
	}
}
