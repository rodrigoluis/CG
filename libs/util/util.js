import * as THREE from '../../build/three.module.js';
import {TrackballControls} from '../../build/jsm/controls/TrackballControls.js';

/**
 * Get ASCII table code of a given character
 * Use character in uppercase
 *
 * @param {char} ch
 * @returns ASCII code of the caracter
 */
export function getCode(ch)
{
  var code = ch.charCodeAt(0);
  return code;
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians)
{
  var pi = Math.PI;
  return radians * (180/pi);
}

/**
 * Format output to show 'num' number with 'decimalPlaces' decimal places
 */
export function formatOutput(num, decimalPlaces)
{
  return (Math.round(num * 100) / 100).toFixed(decimalPlaces);
}


/**
 Compute the max size acording to XYZ axes
 Return the maxSzie
*/
export function getMaxSize(obj)
{
  var maxSize;
  var box = new THREE.Box3().setFromObject( obj );
  var min = box.min;
  var max = box.max;

  var size = new THREE.Box3();
  size.x = max.x - min.x;
  size.y = max.y - min.y;
  size.z = max.z - min.z;

  if(size.x >= size.y && size.x >= size.z)
    maxSize = size.x;
  else {
    if(size.y >= size.z )
      maxSize = size.y;
    else {
      maxSize = size.z;
    }
  }
  return maxSize;
}

/**
  * Class box - show information onscreen
  *
  */
 export class InfoBox {
  constructor() {
    this.infoBox = document.createElement('div');
    this.infoBox.id = "InfoxBox";
    this.infoBox.style.padding = "6px 14px";
    this.infoBox.style.position = "fixed";
    this.infoBox.style.bottom = "0";
    this.infoBox.style.right = "0";
    this.infoBox.style.backgroundColor = "rgba(255,255,255,0.2)";
    this.infoBox.style.color = "white";
    this.infoBox.style.fontFamily = "sans-serif";
    this.infoBox.style.userSelect = "none";
    this.infoBox.style.textAlign = "left";
  }

  addParagraph() {
    const paragraph = document.createElement("br")
    this.infoBox.appendChild(paragraph);              ;
  }

  add(text) {
    var textnode = document.createTextNode(text);
    this.infoBox.appendChild(textnode);
    this.addParagraph();
  }

  show() {
    document.body.appendChild(this.infoBox);
  }
}

/**
  * ...
  *
  */
export class SecondaryBox
{
  constructor(defaultText) {
    this.box = document.createElement('div');
    this.box.id = "box";
    this.box.style.padding = "6px 14px";
    this.box.style.bottom = "0";
    this.box.style.left= "0";
    this.box.style.position = "fixed";
    this.box.style.backgroundColor = "rgba(100,100,255,0.3)";
    this.box.style.color = "white";
    this.box.style.fontFamily = "sans-serif";
    this.box.style.fontSize = "26px";

    this.textnode = document.createTextNode(defaultText);
    this.box.appendChild(this.textnode);
    document.body.appendChild(this.box);
  }
  changeMessage(newText) {
    this.textnode.nodeValue = newText;
  }
}

/**
  * Do not allow that max is lower then min
  *
  */
export class MinMaxGUIHelper {
  constructor(obj, minProp, maxProp, minDif) {
    this.obj = obj;
    this.minProp = minProp;
    this.maxProp = maxProp;
    this.minDif = minDif;
  }
  get min() {
    return this.obj[this.minProp];
  }
  get max() {
    return this.obj[this.maxProp];
  }
  set min(v) {
    this.obj[this.minProp] = v;
    this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
  }
  set max(v) {
    this.obj[this.maxProp] = v;
    this.min = this.min;  // this will call the min setter
  }
}

/**
 * Makes a definite light follows the camera
 */
export function lightFollowingCamera(light, camera)
{
  light.position.copy( camera.position );
}


/**
 * Fix camera and renderer when window size changes
 */
export function onWindowResize(camera, renderer){

    if (camera instanceof THREE.PerspectiveCamera)
    {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
    }
    else {
      // TODO for other cameras
    }
}

/**
 * Initialize the statistics domelement
 *
 * @param {Number} type 0: fps, 1: ms, 2: mb, 3+: custom
 * @returns stats javascript object
 */
export function initStats(type) {

    var panelType = (typeof type !== 'undefined' && type) && (!isNaN(type)) ? parseInt(type) : 0;
    var stats = new Stats();

    stats.showPanel(panelType); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    return stats;
}

/**
 * Initialize a simple default renderer and binds it to the "webgl-output" dom
* element.
 *
 * @param additionalProperties Additional properties to pass into the renderer
 */
export function initRenderer(additionalProperties) {

    var props = (typeof additionalProperties !== 'undefined' && additionalProperties) ? additionalProperties : {};
    var renderer = new THREE.WebGLRenderer(props);
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setClearColor(new THREE.Color("rgb(0, 0, 0)"));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById("webgl-output").appendChild(renderer.domElement);

    return renderer;
}



/**
 * Initialize a simple default canvas renderer.
 *
 */
export function initCanvasRenderer() {

    var canvasRenderer = new THREE.CanvasRenderer();
    canvasRenderer.setClearColor(new THREE.Color(0x000000));
    canvasRenderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("webgl-output").appendChild(canvasRenderer.domElement);

    return canvasRenderer;
}

/**
 * Initialize a simple camera and point it at the center of a scene
 *
 * @param {THREE.Vector3} [initialPosition]
 */
export function initCamera(initialPosition) {
    var position = (initialPosition !== undefined) ? initialPosition : new THREE.Vector3(-30, 40, 30);
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(position);
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // or camera.lookAt(0, 0, 0);
    //camera.up.set(0, 1, 0); // That's the default value
    return camera;
}

export function initDefaultBasicLight(scene, castShadow = false, position = new THREE.Vector3(1, 1, 1)) 
{
  //let position = (initialPosition !== undefined) ? initialPosition : new THREE.Vector3(1, 1, 1);

  const ambientLight = new THREE.HemisphereLight(
    'white', // bright sky color
    'darkslategrey', // dim ground color
    0.5, // intensity
  );

  const mainLight = new THREE.DirectionalLight('white', 0.7);
    mainLight.position.copy(position);
    mainLight.castShadow = castShadow;

  // Directional ligth's shadow uses an OrthographicCamera to set shadow parameteres
  // and its left, right, bottom, top, near and far parameters are, respectively,
  // (-5, 5, -5, 5, 0.5, 500).    
  const shadow = mainLight.shadow;
    shadow.mapSize.width  =  512; 
    shadow.mapSize.height =  512; 
    shadow.camera.near    =  0.1; 
    shadow.camera.far     =  50; 
    shadow.camera.left    = -8.0; 
    shadow.camera.right   =  8.0; 
    shadow.camera.bottom  = -8.0; 
    shadow.camera.top     =  8.0; 

  scene.add(ambientLight);
  scene.add(mainLight);
}

export function initDefaultSpotlight(scene, initialPosition) {
    var position = (initialPosition !== undefined) ? initialPosition : new THREE.Vector3(-10, 30, 40);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.name = "spotLight"
    spotLight.position.copy(position);
    spotLight.castShadow = true;
    spotLight.distance = 0;    
    spotLight.decay = 2;
    spotLight.penumbra = 0.5;
    spotLight.angle = degreesToRadians(40);    
    spotLight.shadow.mapSize.width = 512;
    spotLight.shadow.mapSize.height = 512;
    scene.add(spotLight);

    var ambientLight = new THREE.AmbientLight(0x343434);
    ambientLight.name = "ambientLight";
    scene.add(ambientLight);

    return spotLight; // RETURN ADDED IN MAI/2020
}

/*
 * Sphere to represent light position
 */
export function createLightSphere(scene, radius, widthSegments, heightSegments, position)
{
  var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI);
  var material = new THREE.MeshBasicMaterial({color:"rgb(255,255,50)"});
  var object = new THREE.Mesh(geometry, material);
    object.visible = true;
    object.position.copy(position);
  scene.add(object);

  return object;
}

export function initDefaultDirectionalLighting(scene, initialPosition) {
    var position = (initialPosition !== undefined) ? initialPosition : new THREE.Vector3(100, 200, 200);

    var dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.copy(position);
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.castShadow = true;

    dirLight.shadow.camera.left = -200;
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;

    scene.add(dirLight);

    var ambientLight = new THREE.AmbientLight(0x343434);
    ambientLight.name = "ambientLight";
    scene.add(ambientLight);
}

/**
 * Initialize trackball controls to control the scene
 *
 * @param {THREE.Camera} camera
 * @param {THREE.Renderer} renderer
 */
export function initTrackballControls(camera, renderer) {
    var trackballControls = new TrackballControls(camera, renderer.domElement);
    trackballControls.rotateSpeed = 1.0;
    trackballControls.zoomSpeed = 1.2;
    trackballControls.panSpeed = 0.8;
    trackballControls.noZoom = false;
    trackballControls.noPan = false;
    trackballControls.staticMoving = true;
    trackballControls.dynamicDampingFactor = 0.3;
    trackballControls.keys = [65, 83, 68];

    return trackballControls;
}

/**
 * Apply a simple standard material to the passed in geometry and return the mesh
 *
 * @param {*} geometry
 * @param {*} material if provided use this meshnormal material instead of creating a new material
 *                     this material will only be used if it is a meshnormal material.
 */
var applyMeshStandardMaterial = function(geometry, material) {
    if (!material || material.type !== "MeshStandardMaterial")  {
        var material = new THREE.MeshStandardMaterial({color: 0xff0000})
        material.side = THREE.DoubleSide;
    }

    return new THREE.Mesh(geometry, material)
}

/**
 * Apply meshnormal material to the geometry, optionally specifying whether
 * we want to see a wireframe as well.
 *
 * @param {*} geometry
 * @param {*} material if provided use this meshnormal material instead of creating a new material
 *                     this material will only be used if it is a meshnormal material.
 */
var applyMeshNormalMaterial = function(geometry, material) {
    if (!material || material.type !== "MeshNormalMaterial")  {
        material = new THREE.MeshNormalMaterial();
        material.side = THREE.DoubleSide;
    }

    return new THREE.Mesh(geometry, material)
}

/**
 * Add a simple cube and sphere to the provided scene
 *
 * @param {THREE.Scene} scene
 */
export function addDefaultCubeAndSphere(scene) {

    // create a cube
    var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
    var cubeMaterial = new THREE.MeshLambertMaterial({
        color: 0xff0000
    });
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.castShadow = true;

    // position the cube
    cube.position.x = -4;
    cube.position.y = 3;
    cube.position.z = 0;

    // add the cube to the scene
    scene.add(cube);

    var sphereGeometry = new THREE.SphereGeometry(4, 20, 20);
    var sphereMaterial = new THREE.MeshLambertMaterial({
        color: 0x7777ff
    });
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // position the sphere
    sphere.position.x = 20;
    sphere.position.y = 0;
    sphere.position.z = 2;
    sphere.castShadow = true;

    // add the sphere to the scene
    scene.add(sphere);

    return {
        cube: cube,
        sphere: sphere
    };
}

/**
 * Create a small and simple ground plane. Width and Height are in X and Y
 */
export function createGroundPlane(width, height, widthSegments = 10, heightSegments = 10, gcolor = null)
{
  if(!gcolor) gcolor = "rgb(200,200,200)";
  // create the ground plane
  var planeGeometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  var planeMaterial = new THREE.MeshLambertMaterial({color:gcolor, side:THREE.DoubleSide});
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;

  return plane;
}

/**
 * Create a ground plane that has a wireframe over it
 */
export function createGroundPlaneWired(width, height, widthSegments = 10, heightSegments = 10, gcolor = null)
{
  if(!gcolor) gcolor = "rgb(60, 30, 150)";  
  
  //---------------------------------------------------------------------------------------
  // create the ground plane with wireframe
  var planeGeometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    planeGeometry.translate(0.0, 0.0, -0.02); // To avoid conflict with the axeshelper
  var planeMaterial = new THREE.MeshPhongMaterial({
    color: gcolor,
    polygonOffset: true,
    polygonOffsetFactor: 1, // positive value pushes polygon further away
    polygonOffsetUnits: 1
  });
  
  var wireframe = new THREE.WireframeGeometry( planeGeometry );
    var line = new THREE.LineSegments( wireframe );
    line.material.color.setStyle( "rgb(150, 150, 150)" );  

  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;  
    plane.add(line);
    plane.rotateX(-Math.PI/2);
  
  return plane;
}

/**
 * Add a simple ground plance to the provided scene
 *
 * @param {THREE.Scene} scene
 */
export function addGroundPlane(scene) {
    // create the ground plane
    var planeGeometry = new THREE.PlaneGeometry(60, 20, 120, 120);
    var planeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff
    });
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;

    // rotate and position the plane
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 15;
    plane.position.y = 0;
    plane.position.z = 0;

    scene.add(plane);

    return plane;
}

/**
 * Add a simple ground plance to the provided scene
 *
 * @param {THREE.Scene} scene
 */
export function addLargeGroundPlane(scene, useTexture) {

    var withTexture = (useTexture !== undefined) ? useTexture : false;

    // create the ground plane
    var planeGeometry = new THREE.PlaneGeometry(10000, 10000);
    var planeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff
    });
    if (withTexture) {
        var textureLoader = new THREE.TextureLoader();
        planeMaterial.map = textureLoader.load("../../assets/textures/general/floor-wood.jpg");
        planeMaterial.map.wrapS = THREE.RepeatWrapping;
        planeMaterial.map.wrapT = THREE.RepeatWrapping;
        planeMaterial.map.repeat.set(80,80)
    }
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;

    // rotate and position the plane
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = 0;
    plane.position.z = 0;

    scene.add(plane);

    return plane;
}

export function addHouseAndTree(scene) {

    createBoundingWall(scene);
    createGroundPlane(scene);
    createHouse(scene);
    createTree(scene);

    function createBoundingWall(scene) {
        var wallLeft = new THREE.CubeGeometry(70, 2, 2);
        var wallRight = new THREE.CubeGeometry(70, 2, 2);
        var wallTop = new THREE.CubeGeometry(2, 2, 50);
        var wallBottom = new THREE.CubeGeometry(2, 2, 50);

        var wallMaterial = new THREE.MeshPhongMaterial({
            color: 0xa0522d
        });

        var wallLeftMesh = new THREE.Mesh(wallLeft, wallMaterial);
        var wallRightMesh = new THREE.Mesh(wallRight, wallMaterial);
        var wallTopMesh = new THREE.Mesh(wallTop, wallMaterial);
        var wallBottomMesh = new THREE.Mesh(wallBottom, wallMaterial);

        wallLeftMesh.position.set(15, 1, -25);
        wallRightMesh.position.set(15, 1, 25);
        wallTopMesh.position.set(-19, 1, 0);
        wallBottomMesh.position.set(49, 1, 0);

        scene.add(wallLeftMesh);
        scene.add(wallRightMesh);
        scene.add(wallBottomMesh);
        scene.add(wallTopMesh);

    }

    function createGroundPlane(scene) {
        // create the ground plane
        var planeGeometry = new THREE.PlaneGeometry(70, 50);
        var planeMaterial = new THREE.MeshPhongMaterial({
            color: 0x9acd32
        });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;

        // rotate and position the plane
        plane.rotation.x = -0.5 * Math.PI;
        plane.position.x = 15;
        plane.position.y = 0;
        plane.position.z = 0;

        scene.add(plane)
    }

    function createHouse(scene) {
        var roof = new THREE.ConeGeometry(5, 4);
        var base = new THREE.CylinderGeometry(5, 5, 6);

        // create the mesh
        var roofMesh = new THREE.Mesh(roof, new THREE.MeshPhongMaterial({
            color: 0x8b7213
        }));
        var baseMesh = new THREE.Mesh(base, new THREE.MeshPhongMaterial({
            color: 0xffe4c4
        }));

        roofMesh.position.set(25, 8, 0);
        baseMesh.position.set(25, 3, 0);

        roofMesh.receiveShadow = true;
        baseMesh.receiveShadow = true;
        roofMesh.castShadow = true;
        baseMesh.castShadow = true;

        scene.add(roofMesh);
        scene.add(baseMesh);
    }

    /**
     * Add the tree to the scene
     * @param scene The scene to add the tree to
     */
    function createTree(scene) {
        var trunk = new THREE.CubeGeometry(1, 8, 1);
        var leaves = new THREE.SphereGeometry(4);

        // create the mesh
        var trunkMesh = new THREE.Mesh(trunk, new THREE.MeshPhongMaterial({
            color: 0x8b4513
        }));
        var leavesMesh = new THREE.Mesh(leaves, new THREE.MeshPhongMaterial({
            color: 0x00ff00
        }));

        // position the trunk. Set y to half of height of trunk
        trunkMesh.position.set(-10, 4, 0);
        leavesMesh.position.set(-10, 12, 0);

        trunkMesh.castShadow = true;
        trunkMesh.receiveShadow = true;
        leavesMesh.castShadow = true;
        leavesMesh.receiveShadow = true;

        scene.add(trunkMesh);
        scene.add(leavesMesh);
    }
}

function createGhostTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;

    var ctx = canvas.getContext('2d');
    // the body
    ctx.translate(-81, -84);

    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.moveTo(83, 116);
    ctx.lineTo(83, 102);
    ctx.bezierCurveTo(83, 94, 89, 88, 97, 88);
    ctx.bezierCurveTo(105, 88, 111, 94, 111, 102);
    ctx.lineTo(111, 116);
    ctx.lineTo(106.333, 111.333);
    ctx.lineTo(101.666, 116);
    ctx.lineTo(97, 111.333);
    ctx.lineTo(92.333, 116);
    ctx.lineTo(87.666, 111.333);
    ctx.lineTo(83, 116);
    ctx.fill();

    // the eyes
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(91, 96);
    ctx.bezierCurveTo(88, 96, 87, 99, 87, 101);
    ctx.bezierCurveTo(87, 103, 88, 106, 91, 106);
    ctx.bezierCurveTo(94, 106, 95, 103, 95, 101);
    ctx.bezierCurveTo(95, 99, 94, 96, 91, 96);
    ctx.moveTo(103, 96);
    ctx.bezierCurveTo(100, 96, 99, 99, 99, 101);
    ctx.bezierCurveTo(99, 103, 100, 106, 103, 106);
    ctx.bezierCurveTo(106, 106, 107, 103, 107, 101);
    ctx.bezierCurveTo(107, 99, 106, 96, 103, 96);
    ctx.fill();

    // the pupils
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(101, 102, 2, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(89, 102, 2, 0, Math.PI * 2, true);
    ctx.fill();


    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
};

/**
 * Add a folder to the gui containing the basic material properties.
 *
 * @param gui the gui to add to
 * @param controls the current controls object
 * @param material the material to control
 * @param geometry the geometry we're working with
 * @param name optionally the name to assign to the folder
 */
function addBasicMaterialSettings(gui, controls, material, name) {

    var folderName = (name !== undefined) ? name : 'THREE.Material';

    controls.material = material;

    var folder = gui.addFolder(folderName);
    folder.add(controls.material, 'id');
    folder.add(controls.material, 'uuid');
    folder.add(controls.material, 'name');
    folder.add(controls.material, 'opacity', 0, 1, 0.01);
    folder.add(controls.material, 'transparent');
    folder.add(controls.material, 'overdraw', 0, 1, 0.01);
    folder.add(controls.material, 'visible');
    folder.add(controls.material, 'side', {FrontSide: 0, BackSide: 1, BothSides: 2}).onChange(function (side) {
        controls.material.side = parseInt(side)
    });

    folder.add(controls.material, 'colorWrite');
    folder.add(controls.material, 'flatShading').onChange(function(shading) {
        controls.material.flatShading = shading;
        controls.material.needsUpdate = true;
    });
    folder.add(controls.material, 'premultipliedAlpha');
    folder.add(controls.material, 'dithering');
    folder.add(controls.material, 'shadowSide', {FrontSide: 0, BackSide: 1, BothSides: 2});
    folder.add(controls.material, 'vertexColors', {NoColors: THREE.NoColors, FaceColors: THREE.FaceColors, VertexColors: THREE.VertexColors}).onChange(function (vertexColors) {
        material.vertexColors = parseInt(vertexColors);
    });
    folder.add(controls.material, 'fog');

    return folder;
}

function addSpecificMaterialSettings(gui, controls, material, name) {
    controls.material = material;

    var folderName = (name !== undefined) ? name : 'THREE.' + material.type;
    var folder = gui.addFolder(folderName);
    switch (material.type) {
        case "MeshNormalMaterial":
            folder.add(controls.material,'wireframe');
            return folder;

        case "MeshPhongMaterial":
            controls.specular = material.specular.getStyle();
            folder.addColor(controls, 'specular').onChange(function (e) {
                material.specular.setStyle(e)
            });
            folder.add(material, 'shininess', 0, 100, 0.01);
            return folder;

        case "MeshStandardMaterial":
            controls.color = material.color.getStyle();
            folder.addColor(controls, 'color').onChange(function (e) {
                material.color.setStyle(e)
            });
            controls.emissive = material.emissive.getStyle();
            folder.addColor(controls, 'emissive').onChange(function (e) {
                material.emissive.setStyle(e)
            });
            folder.add(material, 'metalness', 0, 1, 0.01);
            folder.add(material, 'roughness', 0, 1, 0.01);
            folder.add(material, 'wireframe');

            return folder;
    }
}

function redrawGeometryAndUpdateUI(gui, scene, controls, geomFunction) {
    guiRemoveFolder(gui, controls.specificMaterialFolder);
    guiRemoveFolder(gui, controls.currentMaterialFolder);
    if (controls.mesh) scene.remove(controls.mesh)
    var changeMat = eval("(" + controls.appliedMaterial + ")")
    if (controls.mesh) {
        controls.mesh = changeMat(geomFunction(), controls.mesh.material);
    } else {
        controls.mesh = changeMat(geomFunction());
    }

    controls.mesh.castShadow = controls.castShadow;
    scene.add(controls.mesh)
    controls.currentMaterialFolder = addBasicMaterialSettings(gui, controls, controls.mesh.material);
    controls.specificMaterialFolder = addSpecificMaterialSettings(gui, controls, controls.mesh.material);
  }

/**
 * Remove a folder from the dat.gui
 *
 * @param {*} gui
 * @param {*} folder
 */
function guiRemoveFolder(gui, folder) {
    if (folder && folder.name && gui.__folders[folder.name]) {
        gui.__folders[folder.name].close();
        gui.__folders[folder.name].domElement.parentNode.parentNode.removeChild(gui.__folders[folder.name].domElement.parentNode);
        delete gui.__folders[folder.name];
        gui.onResize();
    }
}

/**
 *
 *
 * @param gui the gui to add to
 * @param controls the current controls object
 * @param material material for the meshes
 */
function addMeshSelection(gui, controls, material, scene) {
  var sphereGeometry = new THREE.SphereGeometry(10, 20, 20);
  var cubeGeometry = new THREE.BoxGeometry(16, 16, 15);
  var planeGeometry = new THREE.PlaneGeometry(14, 14, 4, 4);

  var sphere = new THREE.Mesh(sphereGeometry, material);
  var cube = new THREE.Mesh(cubeGeometry, material);
  var plane = new THREE.Mesh(planeGeometry, material);

  sphere.position.x = 0;
  sphere.position.y = 11;
  sphere.position.z = 2;

  cube.position.y = 8;

  controls.selectedMesh = "cube";
  loadGopher(material).then(function(gopher) {

    gopher.scale.x = 5;
    gopher.scale.y = 5;
    gopher.scale.z = 5;
    gopher.position.z = 0
    gopher.position.x = -10
    gopher.position.y = 0

    gui.add(controls, 'selectedMesh', ["cube", "sphere", "plane", "gopher"]).onChange(function (e) {

      scene.remove(controls.selected);

      switch (e) {
        case "cube":
          scene.add(cube);
          controls.selected = cube;
          break;
        case "sphere":
          scene.add(sphere);
          controls.selected = sphere;
          break;
        case "plane":
          scene.add(plane);
          controls.selected = plane;
          break;
        case "gopher":
          scene.add(gopher);
          controls.selected = gopher;
          break;
      }
    });
  });

  controls.selected = cube;
  scene.add(controls.selected);
}

/**
 * Load a gopher, and apply the material
 * @param material if set apply this material to the gopher
 * @returns promise which is fullfilled once the goher is loaded
 */
function loadGopher(material) {
    var loader = new THREE.OBJLoader();
    var mesh = null;
    var p = new Promise(function(resolve) {
        loader.load('../../assets/models/gopher/gopher.obj', function (loadedMesh) {
            // this is a group of meshes, so iterate until we reach a THREE.Mesh
            mesh = loadedMesh;
            if (material) {
                // material is defined, so overwrite the default material.
                computeNormalsGroup(mesh);
                setMaterialGroup(material, mesh);
            }
            resolve(mesh);
        });
    });

    return p;
}

function setMaterialGroup(material, group) {
    if (group instanceof THREE.Mesh) {
        group.material = material;
    } else if (group instanceof THREE.Group) {
        group.children.forEach(function(child) {setMaterialGroup(material, child)});
    }
}

function computeNormalsGroup(group) {
    if (group instanceof THREE.Mesh) {
        var tempGeom = new THREE.Geometry();
        tempGeom.fromBufferGeometry(group.geometry)
        tempGeom.computeFaceNormals();
        tempGeom.mergeVertices();
        tempGeom.computeVertexNormals();

        tempGeom.normalsNeedUpdate = true;

        // group = new THREE.BufferGeometry();
        // group.fromGeometry(tempGeom);
        group.geometry = tempGeom;

    } else if (group instanceof THREE.Group) {
        group.children.forEach(function(child) {computeNormalsGroup(child)});
    }
}
