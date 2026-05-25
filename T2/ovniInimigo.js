  import { OBJLoader } from "../../build/jsm/loaders/OBJLoader.js";
  import { MTLLoader } from "../../build/jsm/loaders/MTLLoader.js";

  export function carregarAviaoInimigo2() {
    return new Promise((resolve) => {
      const mtlLoader = new MTLLoader();
      mtlLoader.setPath("./assets/Flying saucer/");
      mtlLoader.load("1352 Flying Saucer.mtl", (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./assets/Flying saucer/1352 Flying Saucer.obj", (object) => {
          object.name = "aviaoInimigo";
          object.scale.set(0.12, 0.12, 0.12);
          resolve(object);
        });
      });
    });
  }