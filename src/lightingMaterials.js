function main()
{
  var scene = new THREE.Scene();    // Create main scene
  var stats = initStats();          // To show FPS information
  var lightPosition = new THREE.Vector3(1.7, 0.8, 1.1);
  var light = initDefaultLighting(scene, lightPosition); // Use default light
  var lightSphere = createLightSphere(scene, 0.1, 10, 10, lightPosition);

  var renderer = initRenderer();    // View function in util/utils
    renderer.setClearColor("rgb(30, 30, 42)");
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.lookAt(0, 0, 0);
    camera.position.set(2.18, 1.62, 3.31);
    camera.up.set( 0, 1, 0 );

  // To use the keyboard
  var keyboard = new KeyboardState();

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls(camera);

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  var groundPlane = createGroundPlane(4.0, 2.5); // width and height
    groundPlane.rotateX(degreesToRadians(-90));
  scene.add(groundPlane);

  // Show axes (parameter is size of each axis)
  var axesHelper = new THREE.AxesHelper( 1.5 );
    axesHelper.visible = false;
  scene.add( axesHelper );

  // Show text information onscreen
  showInformation();

  var infoBox = new SecondaryBox("");

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  // Load ....
  var objectArray = new Array();
  var activeObject = 0; // View first object

  //---------------------------------------------------------
  // Default light position, color, ambient color and intensity


  // Teapot --- fullsize: 1, tess: 6, bottom: true, lid: true, body: true, fitLid: true, nonblinn: false;
  var geometry = new THREE.TeapotGeometry(0.5,6,true,true,true,true,false);

  usePhongMaterial(geometry, true);
  useLambertMaterial(geometry, false);
  useNormalMaterial(geometry, false);
  useNormalMaterialFlat(geometry, false);
  useToonMaterial(geometry, false);
  useBasicMaterial(geometry, false);
  useBasicMaterialWireframe(geometry, false);


  render();

  //More information here: https://threejs.org/docs/#api/en/materials/MeshNormalMaterial
  function useNormalMaterial(geometry, visibility)
  {
    var material = new THREE.MeshNormalMaterial();

    buildObject(geometry, material, visibility, "Normal Material");
  }

  function useNormalMaterialFlat(geometry, visibility)
  {
    var material = new THREE.MeshNormalMaterial({flatShading: true});

    buildObject(geometry, material, visibility, "Normal Material - Flat");
  }

  //More information here: https://threejs.org/docs/#api/en/materials/MeshToonMaterial
  function useToonMaterial(geometry, visibility)
  {
    var material = new THREE.MeshToonMaterial({
      color:"rgb(230,120,50)",     // Main color of the object
      aoMapIntensity:"0.1"
    });

    buildObject(geometry, material, visibility, "Toon Material");
  }

  //More information here: https://threejs.org/docs/#api/en/materials/MeshBasicMaterial
  function useBasicMaterial(geometry, visibility)
  {
    var material = new THREE.MeshBasicMaterial({
      color:"rgb(255,20,20)"     // Main color of the object
    });

    buildObject(geometry, material, visibility, "Basic Material");
  }

  function useBasicMaterialWireframe(geometry, visibility)
  {
    var material = new THREE.MeshBasicMaterial({
      color:"rgb(255,255,255)",     // Main color of the object
      wireframe: true
    });

    buildObject(geometry, material, visibility, "Basic Material - Wireframe");
  }


  //More information here: https://threejs.org/docs/#api/en/materials/MeshLambertMaterial
  function useLambertMaterial(geometry, visibility)
  {
    var material = new THREE.MeshLambertMaterial({
      color:"rgb(255,20,20)"     // Main color of the object
    });

    buildObject(geometry, material, visibility, "Lambert Material");
  }

  //More information here: https://threejs.org/docs/#api/en/materials/MeshPhongMaterial
  function usePhongMaterial(geometry, visibility)
  {
    var material = new THREE.MeshPhongMaterial({
      color:"rgb(255,20,20)",     // Main color of the object
      shininess:"200",            // Shininess of the object
      specular:"rgb(255,255,255)" // Color of the specular component
    });

    buildObject(geometry, material, visibility, "Phong Material");
  }

  function buildObject(geometry, material, visibility, name)
  {
    var obj = new THREE.Mesh(geometry, material);
      obj.name = name;
      obj.castShadow = true;
      obj.visible = visibility;
      obj.castShadow = true;
      obj.position.set(0.0, 0.5, 0.0);

    scene.add( obj );
    objectArray.push( obj );
  }

  function keyboardUpdate()
  {
    keyboard.update();
  	if ( keyboard.down("A") )
    {
      axesHelper.visible = !axesHelper.visible;
    }
    if ( keyboard.pressed("right") )
    {
      lightPosition.x += 0.05;
      updateLightPosition();
    }
    if ( keyboard.pressed("left") )
    {
      lightPosition.x -= 0.05;
      updateLightPosition();
    }
    if ( keyboard.pressed("up") )
    {
      lightPosition.y += 0.05;
      updateLightPosition();
    }
    if ( keyboard.pressed("down") )
    {
      lightPosition.y -= 0.05;
      updateLightPosition();
    }
    if ( keyboard.pressed("pageup") )
    {
      lightPosition.z -= 0.05;
      updateLightPosition();
    }
    if ( keyboard.pressed("pagedown") )
    {
      lightPosition.z += 0.05;
      updateLightPosition();
    }
    if ( keyboard.down(".") )
    {
      activeObject++;
      if(activeObject < objectArray.length)
      {
        objectArray[activeObject-1].visible = false;
        objectArray[activeObject].visible = true;
      }
      else {
        activeObject = 0;
        objectArray[objectArray.length-1].visible = false;
        objectArray[0].visible = true;
      }
      infoBox.changeMessage("Object " + activeObject + ": " + objectArray[activeObject].name);
    }
    if ( keyboard.down(",") )
    {
      activeObject--;
      if(activeObject < 0)
      {
        activeObject = objectArray.length-1;
        objectArray[0].visible = false;
        objectArray[activeObject].visible = true;
      }
      else {
        objectArray[activeObject+1].visible = false;
        objectArray[activeObject].visible = true;
      }
      infoBox.changeMessage("Object " + activeObject + ": " + objectArray[activeObject].name);
    }
  }

  // Update light position of the current light
  function updateLightPosition()
  {
    light.position.copy(lightPosition);
    lightSphere.position.copy(lightPosition);
  }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Lighting - Types of Materials");
      controls.show();
      controls.addParagraph();
      controls.add("Pressione ',' e '.' para os materiais.");
      controls.add("Pressione 'A' para habilitar/desabilitar os eixos.");
      controls.add("Pressione setas para mover a fonte de luz em X e Y");
      controls.add("Pressione 'pageup' e 'pagedown' para mover a luz em Z");
      controls.show();
  }

  function render()
  {
    stats.update();
    trackballControls.update();
    keyboardUpdate();
    requestAnimationFrame(render);
    renderer.render(scene, camera)
  }
}
