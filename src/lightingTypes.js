function main()
{
  var scene = new THREE.Scene();    // Create main scene
  var stats = initStats();          // To show FPS information

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

  // Teapot
  // fullsize: 1, tess: 6, bottom: true, lid: true,
  // body: true, fitLid: true, nonblinn: false;
  var geometry = new THREE.TeapotGeometry(0.5,6,true,true,true,true,false);
  var material = new THREE.MeshPhongMaterial({color:"rgb(255,20,20)", shininess:"200"});
    material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;
  // position the cube
  obj.position.set(0.0, 0.5, 0.0);
  // add the cube to the scene
  scene.add(obj);

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  // Control available light and set the active light
  var lightArray = new Array();
  var activeLight = 0; // View first Light

  //---------------------------------------------------------
  // Default light position, color, ambient color and intensity
  var lightPosition = new THREE.Vector3(1.7, 0.8, 1.1);
  var lightColor = "rgb(255,255,255)";
  var ambientColor = "rgb(50,50,50)";
  var lightIntensity = 1.0;

  // Sphere to represent the light
  var lightSphere = createLightSphere(scene, 0.05, 10, 10, lightPosition);

  //---------------------------------------------------------
  // Create and set all lights. Only Spot and ambient will be visible at first
  var spotLight = new THREE.SpotLight(lightColor);
  setSpotLight(lightPosition);

  var dirLight = new THREE.DirectionalLight(lightColor);
  setDirectionalLighting(lightPosition);

  var pointLight = new THREE.DirectionalLight(lightColor);
  setPointLight(lightPosition);

  // More info here: https://threejs.org/docs/#api/en/lights/AmbientLight
  var ambientLight = new THREE.AmbientLight(ambientColor);
  scene.add( ambientLight );

  render();

  // Set Point Light
  // More info here: https://threejs.org/docs/#api/en/lights/PointLight
  function setPointLight(position)
  {
    pointLight.position.copy(position);
    pointLight.name = "Point Light"
    pointLight.castShadow = true;
    pointLight.visible = false;

    scene.add( pointLight );
    lightArray.push( pointLight );
  }

  // Set Spotlight
  // More info here: https://threejs.org/docs/#api/en/lights/SpotLight
  function setSpotLight(position)
  {
    spotLight.position.copy(position);
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.fov = 15;
    spotLight.castShadow = true;
    spotLight.decay = 2;
    spotLight.penumbra = 0.05;
    spotLight.name = "Spot Light"

    scene.add(spotLight);
    lightArray.push( spotLight );
  }

  // Set Directional Light
  // More info here: https://threejs.org/docs/#api/en/lights/DirectionalLight
  function setDirectionalLighting(position)
  {
    dirLight.position.copy(position);
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.castShadow = true;

    dirLight.shadow.camera.left = -200;
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;
    dirLight.name = "Direction Light";
    dirLight.visible = false;

    scene.add(dirLight);
    lightArray.push( dirLight );
  }

  // Update light position of the current light
  function updateLightPosition()
  {
    lightArray[activeLight].position.copy(lightPosition);
    lightSphere.position.copy(lightPosition);
    infoBox.changeMessage("Light Position: " + lightPosition.x.toFixed(2) + ", " +
                           lightPosition.y.toFixed(2) + ", " + lightPosition.z.toFixed(2));
  }

  // Update light intensity of the current light
  function updateLightIntensity()
  {
    lightArray[activeLight].intensity = lightIntensity;
  }

  function keyboardUpdate()
  {
    keyboard.update();
  	if ( keyboard.down("A") )
    {
      ambientLight.visible = !ambientLight.visible;
      if(ambientLight)
        infoBox.changeMessage("Ambient Light Enabled");
      else
        infoBox.changeMessage("Ambient Light Disabled");
    }
    if ( keyboard.pressed("="))
    {
      lightIntensity+=0.05;
      infoBox.changeMessage("Intensity: " + lightIntensity.toFixed(2));
      updateLightIntensity();
    }
    if ( keyboard.pressed("-") )
    {
      lightIntensity-=0.05;
      if(lightIntensity <= 0.0) lightIntensity = 0.0
      infoBox.changeMessage("Intensity: " + lightIntensity.toFixed(2));
      updateLightIntensity();
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
      activeLight++;
      if(activeLight < lightArray.length)
      {
        lightArray[activeLight-1].visible = false;
        lightArray[activeLight].visible = true;
      }
      else {
        activeLight = 0;
        lightArray[lightArray.length-1].visible = false;
        lightArray[0].visible = true;
      }
      updateLightPosition();
      updateLightIntensity();
      infoBox.changeMessage("Light " + activeLight + ": " + lightArray[activeLight].name);
    }
    if ( keyboard.down(",") )
    {
      activeLight--;
      if(activeLight < 0)
      {
        activeLight = lightArray.length-1;
        lightArray[0].visible = false;
        lightArray[activeLight].visible = true;
      }
      else {
        lightArray[activeLight+1].visible = false;
        lightArray[activeLight].visible = true;
      }
      updateLightPosition();
      updateLightIntensity();
      infoBox.changeMessage("Light " + activeLight + ": " + lightArray[activeLight].name);
    }

    if ( keyboard.down("Q") )
    {
      axesHelper.visible = !axesHelper.visible;
    }
  }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Lighting - Types of Lights");
      controls.show();
      controls.addParagraph();
      controls.add("Pressione ',' e '.' para alternar o tipo de fonte de luz.");
      controls.add("Pressione 'Q' para habilitar/desabilitar os eixos.");
      controls.add("Pressione 'A' para habilitar/desabilitar luz ambiente.");
      controls.add("Pressione '=' para aumentar a intensidade da luz.");
      controls.add("Pressione '-' para diminuir a intensidade da luz.");
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
