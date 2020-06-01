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

  // Set angles of rotation
  var angle = 0;
  var speed = 0.05;
  var animationOn = true; // control if animation is on or of

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls( camera, renderer.domElement );

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  // Show axes (parameter is size of each axis)
  var axesHelper = new THREE.AxesHelper( 1.5 );
    axesHelper.visible = false;
  scene.add( axesHelper );

  //-- Scene Objects -----------------------------------------------------------
  // Ground
  var groundPlane = createGroundPlane(4.0, 4.0); // width and height
    groundPlane.rotateX(degreesToRadians(-90));
  scene.add(groundPlane);

  // Teapot
  var geometry = new THREE.TeapotBufferGeometry(0.5);
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

  buildInterface();
  render();

  function rotateLight()
  {
    // More info:
    light.matrixAutoUpdate = false;
    lightSphere.matrixAutoUpdate = false;

    // Set angle's animation speed
    if(animationOn)
    {
      angle+=speed;

      var mat4 = new THREE.Matrix4();

      // Will execute T1 and then R1
      light.matrix.identity();  // reset matrix
      light.matrix.multiply(mat4.makeRotationY(angle)); // R1
      light.matrix.multiply(mat4.makeTranslation(2.0, 1.2, 0.0)); // T1

      lightSphere.matrix.copy(light.matrix);
    }
  }

  function buildInterface()
  {
    //------------------------------------------------------------
    // Interface
    var controls = new function ()
    {
      this.viewAxes = false;
      this.speed = speed;
      this.animation = animationOn;

      this.onViewAxes = function(){
        axesHelper.visible = this.viewAxes;
      };
      this.onEnableAnimation = function(){
        animationOn = this.animation;
      };
      this.onUpdateSpeed = function(){
        speed = this.speed;
      };
    };

    var gui = new dat.GUI();
    gui.add(controls, 'animation', true)
      .name("Animation")
      .onChange(function(e) { controls.onEnableAnimation() });
    gui.add(controls, 'speed', 0.01, 0.5)
      .name("Light Speed")
      .onChange(function(e) { controls.onUpdateSpeed() });
    gui.add(controls, 'viewAxes', false)
      .name("View Axes")
      .onChange(function(e) { controls.onViewAxes() });
  }

  function render()
  {
    stats.update();
    trackballControls.update();
    rotateLight();
    requestAnimationFrame(render);
    renderer.render(scene, camera)
  }
}
