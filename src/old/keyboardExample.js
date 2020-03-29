function main()
{
  var stats = initStats();          // To show FPS information
  var scene = new THREE.Scene();    // Create main scene
  var renderer = initRenderer();    // View function in util/utils
  var camera = initCamera(new THREE.Vector3(0, -30, 15)); // Init camera in this position

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls(camera);

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

  showInformation();

  setKeyboard();

  render();

  function setKeyboard() {
      // movement
      document.addEventListener("keydown", onDocumentKeyDown, false);
      function onDocumentKeyDown(event) {
          var keyCode = event.which;
          // up
          if (keyCode == getCode('W')) {
              cube.position.y += 1;
          // down
          } else if (keyCode == getCode('S')) {
              cube.position.y -= 1;
          // left
          } else if (keyCode == getCode('A')) {
              cube.position.x -= 1;
          // right
          } else if (keyCode == getCode('D')) {
              cube.position.x += 1;
          // space
          } else if (keyCode == getCode(' ')) {
              cube.position.x = 0.0;
              cube.position.y = 0.0;
          }
          render();
      };
  }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Keyboard Example");
      controls.addParagraph();
      controls.add("Use WASD para mover o cubo.");
      controls.add("Use ESPAÇO para reinicializar.");
      controls.show();
  }

  function render()
  {
    stats.update(); // Update FPS
    trackballControls.update();
    requestAnimationFrame(render); // Show events
    renderer.render(scene, camera) // Render scene
  }
}
