function main()
{
  var stats = initStats();          // To show FPS information
  var scene = new THREE.Scene();    // Create main scene
  var renderer = initRenderer();    // View function in util/utils
  var clock = new THREE.Clock();

  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  var cameraPos  = new THREE.Vector3(0, -30, 15);
  var cameraLook = new THREE.Vector3(0, 0, 0);
  var cameraUp   = new THREE.Vector3(0, 0, 1);
  var secundaryBox = new SecondaryBox("...");

  changeCamera(camera, cameraPos, cameraLook, cameraUp);

  // Show text information onscreen
  showInformation();

  // To use the keyboard
  var keyboard = new KeyboardState();

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls(camera, renderer.domElement );

  // Show axes (parameter is size of each axis)
  var axesHelper = new THREE.AxesHelper( 12 );
  scene.add( axesHelper );

  // create the ground plane
  var planeGeometry = new THREE.PlaneGeometry(20, 20);
  planeGeometry.translate(0.0, 0.0, -0.02); // To avoid conflict with the axeshelper
  var planeMaterial = new THREE.MeshBasicMaterial({
      color: "rgb(150, 150, 150)",
      side: THREE.DoubleSide
  });
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  // add the plane to the scene
  scene.add(plane);

  // create a cube
  var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
  var cubeMaterial = new THREE.MeshNormalMaterial();
  var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  // position the cube
  cube.position.set(0.0, 0.0, 2.0);
  // add the cube to the scene
  scene.add(cube);
  var angle = 0;

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  render();

  function changeCamera(camera, pos, look, up)
  {
      camera.position.copy(pos);
      camera.lookAt(look);
      camera.up.set(up.x, up.y, up.z); // That's the default value
      secundaryBox.changeMessage("Pos: " + pos.x.toFixed(1) + " " + pos.y.toFixed(1) + " " + pos.z.toFixed(1) +
                                 "  Look: "+ look.x.toFixed(1) + " " + look.y.toFixed(1) + " " + look.z.toFixed(1) +
                                 "  Up: "+ up.x.toFixed(1) + " " + up.y.toFixed(1) + " " + up.z.toFixed(1));
  }

  function keyboardUpdate() {

    keyboard.update();

    var step = 0.5;
    var up = cameraUp.x;

  	if ( keyboard.pressed("left") )   cameraPos.x -= step;
  	if ( keyboard.pressed("right") )  cameraPos.x += step;
    if ( keyboard.pressed("up") )     cameraPos.z += step;
  	if ( keyboard.pressed("down") )   cameraPos.z -= step;

    if ( keyboard.pressed("A") )   cameraLook.x -= step;
  	if ( keyboard.pressed("D") )   cameraLook.x += step;
    if ( keyboard.pressed("W") )   cameraLook.z += step;
  	if ( keyboard.pressed("S") )   cameraLook.z -= step;

    // Modificando o vetor up
    if (keyboard.pressed("Q")) {
      angle += 0.01;
      cameraUp.x = Math.sin( angle );
      cameraUp.z = Math.cos( angle );
    }
    if (keyboard.pressed("E")) {
      angle -= 0.01;
      cameraUp.x = Math.sin( angle );
      cameraUp.z = Math.cos( angle );
    }

    changeCamera(camera, cameraPos, cameraLook, cameraUp);
  }

  function showInformation()
  {
    // // Use this to show information onscreen
    // controls = new InfoBox();
    //   controls.add("Keyboard Example");
    //   controls.addParagraph();
    //   controls.add("Press WASD keys to move continuously");
    //   controls.add("Press arrow keys to move in discrete steps");
    //   controls.add("Press SPACE to put the cube in its original position");
    //   controls.show();
  }

  function render()
  {
    stats.update(); // Update FPS
    requestAnimationFrame(render); // Show events
    trackballControls.update();
    keyboardUpdate();
    renderer.render(scene, camera) // Render scene
  }
}
