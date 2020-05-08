function main()
{
  var scene = new THREE.Scene();    // Create main scene
  var clock = new THREE.Clock();
  var stats = initStats();          // To show FPS information
  var light = initDefaultLighting(scene, new THREE.Vector3(2, 4, 2)); // Use default light

  var renderer = initRenderer();    // View function in util/utils
    renderer.setClearColor("rgb(30, 30, 42)");
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.lookAt(0, 0, 0);
    camera.position.set(2.8, 1.8, 4.0);
    camera.up.set( 0, 1, 0 );

  // Control the appearence of first object loaded
  var firstRender = false;

  // To use the keyboard
  var keyboard = new KeyboardState();

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls( camera, renderer.domElement );

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  var groundPlane = createGroundPlane(5.0, 5.0, "rgb(100,140,90)");
    groundPlane.rotateX(degreesToRadians(-90));
  scene.add(groundPlane);

  // Show axes (parameter is size of each axis)
  var axesHelper = new THREE.AxesHelper( 2 );
    axesHelper.visible = false;
  scene.add( axesHelper );

  // Show text information onscreen
  showInformation();
  var infoBox = new SecondaryBox("");

  //var VRButton = new THREE.VRButton();
  document.body.appendChild( VR.createButton( renderer ) );

  renderer.xr.enabled = true;

  //----------------------------------------------------------------------------
  var man = null;
  var playAction = true;
  var time = 0;
  var mixer = new Array();

  // Load animated files
  loadGLTFFile('../assets/objects/windmill/','scene.gltf', true);
  loadGLTFFile('../assets/objects/walkingMan/','scene.gltf', false);

  render();

  function loadGLTFFile(modelPath, modelName, centerObject)
  {
    var loader = new THREE.GLTFLoader( );
    loader.load( modelPath + modelName, function ( gltf ) {
      var obj = gltf.scene;
      obj.traverse( function ( child ) {
      	if ( child ) {
           child.castShadow = true;
      	}
      });
      obj.traverse( function( node )
      {
        if( node.material ) node.material.side = THREE.DoubleSide;
      });

      // Only fix the position of the centered object
      // The man around will have a different geometric transformation
      if(centerObject)
      {
          obj = normalizeAndRescale(obj, 2);
          obj = fixPosition(obj);
      }
      else {
        man = obj;
      }
      scene.add ( obj );

      // Create animationMixer and push it in the array of mixers
      var mixerLocal = new THREE.AnimationMixer(obj);
      mixerLocal.clipAction( gltf.animations[0] ).play();
      mixer.push(mixerLocal);
			}, onProgress, onError);
  }

  function onError() { };

  function onProgress ( xhr, model ) {
     if ( xhr.lengthComputable ) {
       var percentComplete = xhr.loaded / xhr.total * 100;
       infoBox.changeMessage("Loading... " + Math.round( percentComplete, 2 ) + '% processed' );
     }
  }

  // Normalize scale and multiple by the newScale
  function normalizeAndRescale(obj, newScale)
  {
    var scale = getMaxSize(obj); // Available in 'utils.js'
    obj.scale.set(newScale * (1.0/scale),
                  newScale * (1.0/scale),
                  newScale * (1.0/scale));
    infoBox.changeMessage("Scale: " + scale + " New: " + newScale * (1.0/scale));
    return obj;
  }

  function fixPosition(obj)
  {
    // Fix position of the object over the ground plane
    var box = new THREE.Box3().setFromObject( obj );
    if(box.min.y > 0)
      obj.translateY(-box.min.y);
    else
      obj.translateY(-1*box.min.y);
    return obj;
  }

  function keyboardUpdate()
  {
    keyboard.update();
  	if ( keyboard.down("A") )
    {
      axesHelper.visible = !axesHelper.visible;
    }
    if ( keyboard.down("enter"))
    {
      playAction = !playAction;
    }
  }

  function showInformation()
  {
    // Use this to show information onscreen
    controls = new InfoBox();
      controls.add("Animation - External Objects");
      controls.show();
      controls.addParagraph();
      controls.add("Pressione 'ENTER' para habilitar/desabilitar animação.");
      controls.add("Pressione 'A' para visualizar/ocultar os eixos.");
      controls.show();
  }

  // Function to rotate the man around the center object
  function rotateMan(delta)
  {
    if(man)
    {
      time+=delta*25;

      var mat4 = new THREE.Matrix4();
      var scale = 0.4;
      man.matrixAutoUpdate = false;
      man.matrix.identity();  // reset matrix
      man.matrix.multiply(mat4.makeRotationY(degreesToRadians(-time)));
      man.matrix.multiply(mat4.makeTranslation(2.0, 0.0, 0.0));
      man.matrix.multiply(mat4.makeScale(scale, scale, scale));
    }
  }

  renderer.setAnimationLoop( function () {
    stats.update();
    var delta = clock.getDelta();
    trackballControls.update();
    keyboardUpdate();
    requestAnimationFrame(render);
    //renderer.render(scene, camera);

    // Animation control
    if (playAction)
    {
      for(var i = 0; i<mixer.length; i++)
        mixer[i].update( delta );
      rotateMan(delta);
    }

  	renderer.render( scene, camera );

  } );

  // function render()
  // {
  //   stats.update();
  //   var delta = clock.getDelta();
  //   trackballControls.update();
  //   keyboardUpdate();
  //   requestAnimationFrame(render);
  //   renderer.render(scene, camera);
  //
  //   // Animation control
  //   if (playAction)
  //   {
  //     for(var i = 0; i<mixer.length; i++)
  //       mixer[i].update( delta );
  //     rotateMan(delta);
  //   }
  // }
}
