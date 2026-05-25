  import { OBJLoader } from "../../build/jsm/loaders/OBJLoader.js";
  import { MTLLoader } from "../../build/jsm/loaders/MTLLoader.js";

  export function carregarAviaoInimigo() {
    return new Promise((resolve) => {
      const mtlLoader = new MTLLoader();
      mtlLoader.setPath("./assets/alien in green spaceship/");
      mtlLoader.load("materials.mtl", (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load("./assets/alien in green spaceship/model.obj", (object) => {
          object.name = "aviaoInimigo";
          object.scale.set(13, 10, 10);
          resolve(object);
        });
      });
    });
  }