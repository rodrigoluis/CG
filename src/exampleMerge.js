/*
Example of the "Merge Geometry" Option
With THREE.Geometry.merge(), you can merge geometries together and create a combined one.
*/

function main()
{
  var scene = new THREE.Scene();    // Create main scene
  var stats = initStats();          // To show FPS information
  var renderer = initRenderer();    // View function in util/utils
    renderer.setClearColor("rgb(30, 30, 40)");
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.lookAt(0, 0, 0);
    camera.position.set(25,25,70);
    camera.up.set( 0, 1, 0 );
  var light = initDefaultLighting(scene, new THREE.Vector3(15, 25, 10)); // Use default light
  var lightSphere = createSphere(0.5, 10, 10);
    lightSphere.position.copy(light.position);
  scene.add(lightSphere);

  var groundPlane = createGroundPlane(120, 120); // width and height
    groundPlane.rotateX(degreesToRadians(-90));
    groundPlane.position.set(0,-0.1,0);
  scene.add(groundPlane);

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  // Show text information onscreen
  showInformation();

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls( camera, renderer.domElement );

  //-------------------------------------------------------------------
  // Start the merged object
  mergeGeometry = new THREE.Geometry(); // Storage for merged geometry

  // Create composite object
  var i, j, k, total = 0;
  var size = 0.7;
  for (k = 0; k < 20; k+=size*2)
  {
    for (j = -20+k; j < 20-k; j+=size*2)
    {
      for (i = -20+k; i < 20-k; i+=size*2)
      {
        var cube = createCube(size, size, size);
        cube.position.set(i, k+size/2, j);
        cube.updateMatrix();
        mergeGeometry.merge( cube.geometry, cube.matrix );
        total++;
      }
    }
  }

  var numberOfCubesMessage = new SecondaryBox("Number of cubes: " + total);

  // Material for the entire object
  var material = new THREE.MeshPhongMaterial({color:"rgb(230,120,50)"});
  var mergeObject = new THREE.Mesh(mergeGeometry, material);
  mergeObject.rotateY(degreesToRadians(-90));
  mergeObject.castShadow = true;

  scene.add( mergeObject );
  //-----------------------------------------------------------

  render();

  function createCube(size)
  {
    // create a cube
    var geometry = new THREE.BoxGeometry(size, size, size);
    var object = new THREE.Mesh(geometry);
        object.receiveShadow = true;
    return object;
  }

  function createSphere(radius, widthSegments, heightSegments)
  {
    var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI);
    var material = new THREE.MeshBasicMaterial({color:"rgb(255,255,50)"});
    var object = new THREE.Mesh(geometry, material);
      object.castShadow = true;
    return object;
  }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Merge Geometry Example");
      controls.addParagraph();
      controls.add("Use mouse to rotate/pan/zoom the camera.");
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
