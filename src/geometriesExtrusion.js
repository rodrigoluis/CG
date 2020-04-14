function main()
{
  var scene = new THREE.Scene();    // Create main scene
  var clock = new THREE.Clock();
  var stats = initStats();          // To show FPS information
  var light = initDefaultLighting(scene, new THREE.Vector3(25, 30, 20)); // Use default light
  var renderer = initRenderer();    // View function in util/utils
    renderer.setClearColor("rgb(30, 30, 42)");
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.lookAt(0, 0, 0);
    camera.position.set(5,15,30);
    camera.up.set( 0, 1, 0 );

  // To use the keyboard
  var keyboard = new KeyboardState();

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls(camera);

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  var groundPlane = createGroundPlane(30, 30); // width and height
    groundPlane.rotateX(degreesToRadians(-90));
  scene.add(groundPlane);

  // Show axes (parameter is size of each axis)
  var axesHelper = new THREE.AxesHelper( 12 );
    axesHelper.visible = false;
  scene.add( axesHelper );

  // Show text information onscreen
  showInformation();

  // Object Material
  var objectMaterial = new THREE.MeshPhongMaterial({color:"rgb(50,200,50)"});
    objectMaterial.side =  THREE.DoubleSide; // Show front and back polygons

  //----------------------------------
  // Create Extrude Geometry
  //----------------------------------
  var extrudeSettings =
  {
    depth: 5,
    bevelEnabled: false
  };

  var extrudeGeometry = new THREE.ExtrudeGeometry(smileShape(), extrudeSettings);
  var object = new THREE.Mesh(extrudeGeometry, objectMaterial);
    object.castShadow = true;
  scene.add(object);

  object.translateY(4.0);
  object.rotateZ(degreesToRadians(180));

  render();

  function smileShape()
  {
		var smileyShape = new THREE.Shape();
			smileyShape.absarc( 0.0, 0.0, 4.0, 0, Math.PI * 2, false );

		var smileyEye1Path = new THREE.Path();
			smileyEye1Path.absellipse( -1.5, -2.0, 1.0, 1.0, 0, Math.PI * 2, true );

		var smileyEye2Path = new THREE.Path();
			smileyEye2Path.absarc( 1.5, -2.0, 1.0, 0, Math.PI * 2, true );

		var smileyMouthPath = new THREE.Path();
      smileyMouthPath.moveTo( -2.0, 0.0 );
			smileyMouthPath.quadraticCurveTo( 0.0, 2.0, 2.0, 0.0 )
      smileyMouthPath.bezierCurveTo( 3.0, 0.5, 3.0, 1.0, 2.0, 2.0 )
			smileyMouthPath.quadraticCurveTo( 0.0, 4.0, -2.0, 2.0 )
			smileyMouthPath.quadraticCurveTo( -3.5, 1.0, -2.0, 0.0 );

		smileyShape.holes.push( smileyEye1Path );
		smileyShape.holes.push( smileyEye2Path );
		smileyShape.holes.push( smileyMouthPath );

    return smileyShape;
  }

  function keyboardUpdate()
  {
    keyboard.update();
  	if ( keyboard.down("A") )
    {
      axesHelper.visible = !axesHelper.visible
    }
    if ( keyboard.down("O") )
    {
      object.visible = !object.visible
    }
  }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Extrude Geometry Example");
      controls.show();
      controls.addParagraph();
      controls.add("Pressione 'A' para visualizar/ocultar os eixos.");
      controls.add("Pressione 'O' para visualizar/ocultar o objeto principal.");
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
