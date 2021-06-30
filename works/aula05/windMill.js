import * as THREE from '../../build/three.module.js';
import { degreesToRadians } from '../../../libs/util/util.js';
import CSG from '../../three-csg.js'


const metalLight = new THREE.TextureLoader().load( 'textures/BrushedMetalLight.jpg' );
const metalDark = new THREE.TextureLoader().load( 'textures/BrushedMetalDark.jpg' );

function constructTower() {

    const towerOfWindmill = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 8, 4),
        new THREE.MeshPhongMaterial({ map: metalLight })
        );
    

    return towerOfWindmill;
}


function createBoxWithRoundedEdges( width, height, depth, radius0, smoothness ) {
    let shape = new THREE.Shape();
    let eps = 0.00001;
    let radius = radius0 - eps;
    shape.absarc( eps, eps, eps, -Math.PI / 2, -Math.PI, true );
    shape.absarc( eps, height -  radius * 2, eps, Math.PI, Math.PI / 2, true );
    shape.absarc( width - radius * 2, height -  radius * 2, eps, Math.PI / 2, 0, true );
    shape.absarc( width - radius * 2, eps, eps, 0, -Math.PI / 2, true );
    let geometry = new THREE.ExtrudeBufferGeometry( shape, {
      amount: depth - radius0 * 2,
      bevelEnabled: true,
      bevelSegments: smoothness * 2,
      steps: 1,
      bevelSize: radius,
      bevelThickness: radius0,
      curveSegments: smoothness
    });
    
    geometry.center();
    
    return geometry;
  }

function createArms(){

    const Geometriapartemotor1 = createBoxWithRoundedEdges(1.5, 2, 1.5, 0.5, 10);
    const motorMaterial = new THREE.MeshPhongMaterial({ map: metalDark });
    const partemotor1 = new THREE.Mesh(Geometriapartemotor1, motorMaterial);

    const geometrypartemotor2 = new THREE.CylinderGeometry( 0.45, 0.2, 0.8, 50); 
    const partemotor2 = new THREE.Mesh(geometrypartemotor2, motorMaterial);
   


    partemotor2.rotateX(degreesToRadians(-90));
    partemotor2.translateY(-0.83);
  
    


    partemotor1.updateMatrix();
    partemotor2.updateMatrix();

    const bspA1 = CSG.fromMesh(partemotor1);
    const bspB1 = CSG.fromMesh(partemotor2);
    const bspResult1 = bspA1.union(bspB1);
    var motorFinal = CSG.toMesh(bspResult1, partemotor1.matrix, partemotor1.material);

   

   

    return motorFinal;
}


export function builder()
{
    const tower = constructTower();
    //const head = headOfWindmill();
    const arms = createArms();



    //arms.rotateZ(degreesToRadians(-90));
   
   // head.add(arms);

    tower.add(arms);

    arms.translateY(4);


    return tower;
}