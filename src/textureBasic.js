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

  var lightPosition = new THREE.Vector3(1.7, 0.8, 1.1);
  var light = initDefaultLighting(scene, lightPosition); // Use default light
  var lightSphere = createLightSphere(scene, 0.1, 10, 10, lightPosition);

  // To use the keyboard
  var keyboard = new KeyboardState();

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls(camera);

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  // Show axes (parameter is size of each axis)
  var axesHelper = new THREE.AxesHelper( 1.5 );
    axesHelper.visible = false;
  scene.add( axesHelper );

  // Show text information onscreen
  showInformation();

  //-- Scene Objects -----------------------------------------------------------
  // Ground
  var groundPlane = createGroundPlane(4.0, 4.0); // width and height
    groundPlane.rotateX(degreesToRadians(-90));
  scene.add(groundPlane);

  // Teapot
  var geometry = new THREE.TeapotGeometry(0.5);
  var material = new THREE.MeshPhongMaterial({color:"rgb(255,255,255)", shininess:"100"});
    material.side = THREE.DoubleSide;
  var teapot = new THREE.Mesh(geometry, material);
    teapot.castShadow = true;
    teapot.position.set(0.0, 0.5, -0.6);
  scene.add(teapot);

  // Cube
  var cubeSize = 0.6;
  var cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  var cubeMaterial = new THREE.MeshLambertMaterial();
  var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.castShadow = true;
    cube.position.set(0.0, cubeSize/2, 1.0);
  scene.add(cube);

  //----------------------------------------------------------------------------
  //-- Use TextureLoader to load texture files
  var textureLoader = new THREE.TextureLoader();
  var floor  = textureLoader.load('../assets/textures/floor-wood.jpg');
  var glass  = textureLoader.load('../assets/textures/glass.png');
  var stone = textureLoader.load('../assets/textures/stone.jpg');
  var sun = textureLoader.load('../assets/textures/sun.jpg');

  // Apply texture to the 'map' property of the respective materials' objects
  groundPlane.material.map = floor;
  teapot.material.map = glass;
  cube.material.map = stone;
  lightSphere.material.map = sun;

  render();

  function updateLightPosition()
  {
    light.position.copy(lightPosition);
    lightSphere.position.copy(lightPosition);
  }

  function keyboardUpdate()
  {
    keyboard.update();
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

    if ( keyboard.down("A") )
    {
      axesHelper.visible = !axesHelper.visible;
    }
  }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Texture - Basic");
      controls.addParagraph();
      controls.add("Pressione 'A' para habilitar/desabilitar os eixos.");
      controls.add("Pressione setas, 'pageup' e 'pagedown' para mover a fonte de luz nos eixos");
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
