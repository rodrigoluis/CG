function main()
{
  var stats = initStats();          // To show FPS information
  var scene = new THREE.Scene();    // Create main scene
  var renderer = initRenderer();    // View function in util/utils
  var camera = initCamera(new THREE.Vector3(0, -30, 2)); // Init camera in this position
  var clock = new THREE.Clock();

  // Use to scale the cube
  var scale   = 1.0;

  // Show text information onscreen
  showInformation();

  // To use the keyboard
  var keyboard = new KeyboardState();

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls(camera);

  // Show axes (parameter is size of each axis)
  var axesHelper = new THREE.AxesHelper( 12 );
  scene.add( axesHelper );

  var cube = createCube();
  //scene.add(cube);

  var rotAxis = new THREE.Vector3(0,1,0); // Set y axis
  var angle = degreesToRadians(-45);


  cube.rotateOnAxis(rotAxis,  angle );
  cube.scale.set(2, 1, 1);
  cube.translateX(1);
  //cube.position.set( 3 , 0, 0);
  cube.position.set( 3 , 0, 0);


  var cube2 = createCube();
//  cube.translateX( 1 );
  //cube.rotateOnAxis(rotAxis,  angle );
//  cube2.translateX( 1 );
  cube2.scale.set(2, 1, 1);
  cube2.translateX( 1 );

  var group = new THREE.Group();
  group.add(cube);
  group.add(cube2);

  scene.add(group);
  //group.position.set(1,0,0);




  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  render();

  function keyboardUpdate() {

    keyboard.update();
    group.rotateOnAxis(rotAxis,  0.1 );
    cube.rotateOnAxis(rotAxis,  0.1 );
    var scale = 2.0;
    //cube.matrixAutoUpdate = false;
    //cube.rotateOnAxis(rotAxis,  angle );
    //cube.position.set( 1, 0, 0 );
    //cube.position.set(3,0,0);
    //cube.updateMatrix();
  }

function createCube()
{
  // create a cube
  var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  var cubeMaterial = new THREE.MeshNormalMaterial();
  var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  return cube;
}

  // function keyboardUpdate() {
  //
  //   keyboard.update();
  //
  //   var speed = 30;
  //   var angle = degreesToRadians(10);
  //   var rotAxis = new THREE.Vector3(0,0,1); // Set Z axis
  // 	var moveDistance = speed * clock.getDelta();
  //
  // 	if ( keyboard.pressed("left") )     cube.translateX( -1 );
  // 	if ( keyboard.pressed("right") )    cube.translateX(  1 );
  //   if ( keyboard.pressed("up") )       cube.translateY(  1 );
  // 	if ( keyboard.pressed("down") )     cube.translateY( -1 );
  //   if ( keyboard.pressed("pageup") )   cube.translateZ(  1 );
  // 	if ( keyboard.pressed("pagedown") ) cube.translateZ( -1 );
  //
  // 	if ( keyboard.pressed("A") )  cube.rotateOnAxis(rotAxis,  angle );
  // 	if ( keyboard.pressed("D") )  cube.rotateOnAxis(rotAxis, -angle );
  //
  //   if ( keyboard.pressed("W") )
  //   {
  //     scale+=.1;
  //     cube.scale.set(scale, scale, scale);
  //   }
  // 	if ( keyboard.pressed("S") )
  //   {
  //     scale-=.1;
  //     cube.scale.set(scale, scale, scale);
  //   }
  // }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Geometric Transformation");
      controls.addParagraph();
      controls.add("Pressione as setas para mover o cubo nos planos X e Y.");
      controls.add("Pressione Page Up e Page down para mover o cubo no eixo Z");
      controls.add("Pressione 'A' e 'D' para rotacionar no eixo Z.");
      controls.add("Pressione 'W' e 'S' para mudar a escala em todos os eixos");
      controls.show();
  }

  function render()
  {
    stats.update(); // Update FPS
    trackballControls.update();
    keyboardUpdate();
    requestAnimationFrame(render); // Show events
    renderer.render(scene, camera) // Render scene
  }
}
