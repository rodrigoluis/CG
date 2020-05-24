function main()
{
  var stats = initStats();          // To show FPS information
  var scene = new THREE.Scene();    // Create main scene
  var renderer = initRenderer();    // View function in util/utils
  var camera = initCamera(new THREE.Vector3(5, 5, 7)); // Init camera in this position
  var light  = initDefaultLighting(scene, new THREE.Vector3(0, 0, 15));
  var trackballControls = new THREE.TrackballControls( camera, renderer.domElement );

  // Set angles of rotation
  var angle = 0;
  var angle2 = 0;
  var speed = 0.05;
  var animationOn = true; // control if animation is on or of

  // Show text information onscreen
  showInformation();

  var leftBox = new SecondaryBox("Speed " + speed);

  // Show world axes
  var axesHelper = new THREE.AxesHelper( 12 );
  scene.add( axesHelper );

  // Base sphere
  var sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  var sphereMaterial = new THREE.MeshPhongMaterial( {color:'rgb(180,180,255)'} );
  var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
  scene.add(sphere);
  // Set initial position of the sphere
  sphere.translateX(1.0).translateY(1.0).translateZ(1.0);

  // More information about cylinderGeometry here --> https://threejs.org/docs/#api/en/geometries/CylinderGeometry
  var cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.0, 25);
  var cylinderMaterial = new THREE.MeshPhongMaterial( {color:'rgb(100,255,100)'} );
  var cylinder = new THREE.Mesh( cylinderGeometry, cylinderMaterial );
  sphere.add(cylinder);

  // Rede cylinder
  var cylinderGeometry2 = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 25);
  var cylinderMaterial2 = new THREE.MeshPhongMaterial( {color:'rgb(255,100,100)'} );
  var cylinder2 = new THREE.Mesh( cylinderGeometry2, cylinderMaterial2 );
  cylinder.add(cylinder2);

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  var controls = new function ()
  {
    this.onChangeAnimation = function(){
      animationOn = !animationOn;
    };
    this.speed = 0.05;
    // this.joint2 = 0;
    //
    this.changeSpeed = function(){
      speed = this.speed;
    };
  };

  // GUI interface
  var gui = new dat.GUI();
  gui.add(controls, 'onChangeAnimation',true).name("Animation On/Off");
  gui.add(controls, 'speed', 0.05, 0.5)
    .onChange(function(e) { controls.changeSpeed() })
    .name("Change Speed");

  render();

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Animation");
      controls.addParagraph();
      controls.add("Use o mouse para rotacionar a cena.");
      controls.add("Use os controles para ligar/desligar a animação e alterar a velocidade");
      controls.show();
  }

  function rotateCylinder()
  {
    // More info:
    // https://threejs.org/docs/#manual/en/introduction/Matrix-transformations
    cylinder.matrixAutoUpdate = false;
    cylinder2.matrixAutoUpdate = false;

    // Set angle's animation speed
    if(animationOn)
    {
      angle+=speed;
      angle2+=speed*2;

      var mat4 = new THREE.Matrix4();

      // Will execute T1 and then R1
      cylinder.matrix.identity();  // reset matrix
      cylinder.matrix.multiply(mat4.makeRotationZ(angle)); // R1
      cylinder.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0)); // T1


      var c2angle = degreesToRadians(90);
      cylinder2.matrix.identity();  // reset
      // Will execute R2, T1 and R1 in this order
      cylinder2.matrix.multiply(mat4.makeRotationY(angle2)); // R1
      cylinder2.matrix.multiply(mat4.makeTranslation(0.0, 1.0, 0.0)); // T1
      cylinder2.matrix.multiply(mat4.makeRotationX(c2angle)); // R2
    }
  }

  function render()
  {
    stats.update(); // Update FPS
    trackballControls.update();
    rotateCylinder();
    lightFollowingCamera(light, camera);
    requestAnimationFrame(render); // Show events
    renderer.render(scene, camera) // Render scene
  }
}
