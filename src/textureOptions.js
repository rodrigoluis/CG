function main()
{
  var scene = new THREE.Scene();    // Create main scene
  var stats = initStats();          // To show FPS information
  var renderer = initRenderer();    // View function in util/utils
    renderer.setClearColor("rgb(30, 30, 42)");

  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.lookAt(0, 0, 0);
    camera.position.set(0.0, 0.0, 5.0);
    camera.up.set( 0, 1, 0 );

  var lightPosition = new THREE.Vector3(0.0, 0.0, 5.0);
  var light = initDefaultLighting(scene, lightPosition); // Use default light

  // To use the keyboard
  var keyboard = new KeyboardState();

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls(camera);

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  // Show text information onscreen
  showInformation();

  var infoBox = new SecondaryBox("");

  //----------------------------------------------------------------------------
  //-- Scene Objects -----------------------------------------------------------
  var planeGeometry = new THREE.PlaneGeometry(4.0, 4.0, 10, 10);
  var planeMaterial = new THREE.MeshLambertMaterial({color:"rgb(255,255,255)",side:THREE.DoubleSide});
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  scene.add(plane);

  //----------------------------------------------------------------------------
  //-- Use TextureLoader to load texture files
  var textureLoader = new THREE.TextureLoader();
  var floor  = textureLoader.load('../assets/textures/marble.png');

  // Apply texture to the 'map' property of the plane
  plane.material.map = floor;

  // Set defaults
  var repeatFactor = 2;
  var wrapMode  = THREE.RepeatWrapping;
  var minFilter = THREE.LinearFilter;
  var magFilter = THREE.LinearFilter;
  updateTexture();

  render();

  function updateTexture()
  {
    plane.material.map.repeat.set(repeatFactor,repeatFactor);
    plane.material.map.wrapS = wrapMode;
    plane.material.map.wrapT = wrapMode;
    plane.material.map.minFilter = minFilter;
    plane.material.map.magFilter = magFilter;
  }

  function keyboardUpdate()
  {
    keyboard.update();
    if ( keyboard.down("right") )
    {
      if(repeatFactor <= 5)
      {
        repeatFactor += 1;
        infoBox.changeMessage("Repeat Factor: " + repeatFactor);
        updateTexture();
      }
    }
    if ( keyboard.down("left") )
    {
      if(repeatFactor > 1)
      {
        repeatFactor -= 1;
        infoBox.changeMessage("Repeat Factor: " + repeatFactor);
        updateTexture();
      }
    }
    if ( keyboard.down("C") )
    {
      if(wrapMode == THREE.RepeatWrapping)
      {
        wrapMode = THREE.ClampToEdgeWrapping;
        infoBox.changeMessage("Changing wrapping mode to 'ClampToEdge' ");
      }
      else
      {
        wrapMode = THREE.RepeatWrapping;
        infoBox.changeMessage("Changing wrapping mode to 'Repeat' ");
      }
      plane.material.map.needsUpdate = true;
      updateTexture();
    }
    if ( keyboard.down("N") )
    {
      if(minFilter == THREE.LinearFilter)
      {
        minFilter = THREE.NearestFilter;
        infoBox.changeMessage("Changing minification to 'NearestFilter' ");
      }
      else
      {
        minFilter = THREE.LinearFilter;
        infoBox.changeMessage("Changing minification to 'LinearFilter' ");
      }
      plane.material.map.needsUpdate = true;
      updateTexture();
    }
    if ( keyboard.down("M") )
    {
      if(magFilter == THREE.LinearFilter)
      {
        magFilter = THREE.NearestFilter;
        infoBox.changeMessage("Changing magnification to 'NearestFilter' ");
      }
      else
      {
        magFilter = THREE.LinearFilter;
        infoBox.changeMessage("Changing magnification to 'LinearFilter' ");
      }
      plane.material.map.needsUpdate = true;
      updateTexture();
    }
  }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Texture - Options");
      controls.addParagraph();
      controls.add("Setas para direita e esquerda para aumentar/diminuir fator de repetição");
      controls.add("'C' para alternar entre modos 'Repeat' e 'Clamp' ");
      controls.add("'N' para alternar modos de minificação ");
      controls.add("'M' para alternar modos de magnificação ");
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
