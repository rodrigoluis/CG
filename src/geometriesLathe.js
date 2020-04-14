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
    camera.position.set(5,15,40);
    camera.up.set( 0, 1, 0 );

  // To use the keyboard
  var keyboard = new KeyboardState();

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls(camera);

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  var groundPlane = createGroundPlane(40, 35); // width and height
    groundPlane.rotateX(degreesToRadians(-90));
  scene.add(groundPlane);

  // Show axes (parameter is size of each axis)
  var axesHelper = new THREE.AxesHelper( 12 );
    axesHelper.visible = false;
  scene.add( axesHelper );

  // Show text information onscreen
  showInformation();

  // Object Material
  var objectMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,0,0)"});
    objectMaterial.side =  THREE.DoubleSide; // Show front and back polygons

  //----------------------------------
  // Create Lathe Geometry
  //----------------------------------
  // First, create the point vector to be used by the Lathe algorithm
  var points = generatePoints();
  // Set the main properties of the surface
  var segments = 20;
  var phiStart = 0;
  var phiLength = 2 * Math.PI;
  var latheGeometry = new THREE.LatheGeometry(points, segments, phiStart, phiLength);
  var object = new THREE.Mesh(latheGeometry, objectMaterial);
    object.castShadow = true;
  scene.add(object);

  render();

  function generatePoints()
  {
    var points = [];
    var numberOfPoints = 12;
    for (var i = 0; i < numberOfPoints; i++) {
      points.push(new THREE.Vector2(Math.sin(i*2 / 4.17)+3, i));
    }
    // material for all points
    var material = new THREE.MeshPhongMaterial({color:"rgb(255,255,0)"});

    spGroup = new THREE.Object3D();
    points.forEach(function (point) {
      var spGeom = new THREE.SphereGeometry(0.2);
      var spMesh = new THREE.Mesh(spGeom, material);
      spMesh.position.set(point.x, point.y, 0);
      spGroup.add(spMesh);
    });
    // add the points as a group to the scene
    scene.add(spGroup);
    return points;
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
    if ( keyboard.down("P") )
    {
      spGroup.visible = !spGroup.visible
    }
  }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Lathe Geometry Example");
      controls.show();
      controls.addParagraph();
      controls.add("Pressione 'A' para visualizar/ocultar os eixos.");
      controls.add("Pressione 'O' para visualizar/ocultar o objeto principal.");
      controls.add("Pressione 'P' para visualizar/ocultar os pontos base.");
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
