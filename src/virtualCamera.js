/*
* Example to help understand the virtual camera concept
*/
function main()
{
  var scene = new THREE.Scene();    // Create main scene
  
  var renderer = initRenderer();    // View function in util/utils
    renderer.setClearColor("rgb(80, 70, 170)");
    renderer.autoClear = false; // Disable autoclear feature of the renderer    

  var light = initDefaultLighting(scene, new THREE.Vector3(5.0, 5.0, 5.0)); // Use default light    

  // Main camera
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.lookAt(0, 0, 0);
    camera.position.set(3.6, 4.6, 8.2);
    camera.up.set( 0, 1, 0 );

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new THREE.TrackballControls(camera, renderer.domElement );

  // Listen window size changes
  window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

  var groundPlane = createGroundPlane(10, 10, 40, 40); // width, height, resolutionW, resolutionH
    groundPlane.rotateX(degreesToRadians(-90));
  scene.add(groundPlane);

  // Create objects
  createTeapot( 2.0,  0.5,  0.0, Math.random() * 0xffffff);
  createTeapot(0.0,  0.5,  2.0, Math.random() * 0xffffff);  
  createTeapot(0.0,  0.5, -2.0, Math.random() * 0xffffff);    

  //-------------------------------------------------------------------------------
  // Setting virtual camera
  //-------------------------------------------------------------------------------
  var lookAtVec = new THREE.Vector3( 0.0, 0.0, 0.0 );
  var upVec = new THREE.Vector3( 0.0, 1.0, 0.0 );
  var vcWidth = 400; // virtual camera width
  var vcHeidth = 300; // virtual camera height
  var virtualCamera = new THREE.PerspectiveCamera(45, vcWidth/vcHeidth, 1.0, 30.0);
    virtualCamera.lookAt(lookAtVec);
    virtualCamera.position.set(3.7, 2.2, 1.0);
    virtualCamera.up = upVec;

  // Create helper for the virtual camera
  const cameraHelper = new THREE.CameraHelper(virtualCamera);
  scene.add(cameraHelper);

  // Create 3D representation of the camera (cube and cone)
  cameraObj = createCameraObject();

  buildInterface();
  updateCamera();
  render();

  function createCameraObject()
  {
    var matBody = new THREE.MeshPhongMaterial({color:"rgb(255, 0, 0)"});    
    var matLens = new THREE.MeshPhongMaterial({color:"rgb(255, 255, 0)"});        

    var cBody = new THREE.BoxGeometry(.2, .2, .2);
    var body = new THREE.Mesh(cBody, matBody);

    var cLens = new THREE.ConeGeometry(0.1, 0.2, 20);
    var lens = new THREE.Mesh(cLens, matLens);
      lens.rotateX(degreesToRadians(90));
      lens.position.set(0.0, 0.0, -0.1);

    body.add(lens); // Add lens to the body of the camera

    scene.add(body); // Add camera object to scene
    return body;
  }

  function createTeapot(x, y, z, color )
  {
    var geometry = new THREE.TeapotBufferGeometry(0.5);
    var material = new THREE.MeshPhongMaterial({color, shininess:"200"});
      material.side = THREE.DoubleSide;
    var obj = new THREE.Mesh(geometry, material);
      obj.castShadow = true;
      obj.position.set(x, y, z);
    scene.add(obj);
  }

  function updateCamera()
  {
    //-- Update virtual camera position --
    virtualCamera.lookAt(lookAtVec);        // Update camera position
    virtualCamera.updateProjectionMatrix(); // Necessary when updating FOV angle         
    cameraHelper.update();    

    //-- Update camera 3D representation --
    var cwd = new THREE.Vector3();    
    virtualCamera.getWorldPosition(cwd);
    cameraObj.position.set(cwd.x, cwd.y, cwd.z);
    cameraObj.setRotationFromQuaternion(virtualCamera.quaternion); // Get camera rotation
  }

  function buildInterface()
  {
    //------------------------------------------------------------
    // Interface
    var controls = new function ()
    {
      this.upAngle = 0;   
 
      this.onUpdateNear = function(){
        if(virtualCamera.near >= virtualCamera.far) // set near always smaller than far
        virtualCamera.far = virtualCamera.near+10;
        updateCamera();                
      };     

      this.onUpdateFar = function(){
        if(virtualCamera.far <= virtualCamera.near-0.1) // set far always greater than near
        virtualCamera.near = 0.1;
        updateCamera(); 
      };        

      this.onUpdateUpAngle = function(){
        upVec.x = Math.sin(degreesToRadians(this.upAngle));
        upVec.y = Math.cos(degreesToRadians(this.upAngle));             
        virtualCamera.up.set(upVec.x, upVec.y, upVec.z);
        updateCamera(); 
      };        
    }

    function makeXYZGUI(gui, vector3, name, onChangeFn) {
      const folder = gui.addFolder(name);
      folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
      folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
      folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
      folder.open();
    }  
  
    function makeLookATGUI(gui, camera, name, onChangeFn) {
      const folder = gui.addFolder(name);  
      lookAtVec.applyQuaternion( camera.quaternion );
  
      folder.add(lookAtVec, 'x', -10, 10, 0.1).onChange(onChangeFn);
      folder.add(lookAtVec, 'y', -10, 10, 0.1).onChange(onChangeFn);
      folder.add(lookAtVec, 'z', -10, 10, 0.1).onChange(onChangeFn);
      folder.open();
    }    
        
    var gui = new dat.GUI();

    var vcFolder = gui.addFolder("Virtual Camera");
    vcFolder.open();    
    vcFolder.add(cameraHelper, 'visible', true)
      .name("Camera Helper");
    vcFolder.add(virtualCamera, 'near', .1, 30, 0.1)
      .onChange(function() { controls.onUpdateNear() });
    vcFolder.add(virtualCamera, 'far', .1, 30, 0.1)
      .onChange(function() { controls.onUpdateFar()  });
    vcFolder.add(virtualCamera, 'fov', 10, 90)
      .onChange(updateCamera)
      .name("Fov (degrees)");
    vcFolder.add(controls, 'upAngle', 0, 360)
      .onChange(function() { controls.onUpdateUpAngle() })
      .name("Up (degrees)");      
    makeXYZGUI(vcFolder, virtualCamera.position, 'position', updateCamera);
    makeLookATGUI(vcFolder, virtualCamera, 'Look At', updateCamera);
  }

  function controlledRender()
  {
    var width = window.innerWidth;
    var height = window.innerHeight;
     
    renderer.clear(); 

    // Set main viewport
    renderer.setViewport(0, 0, width, height);
    renderer.render(scene, camera);    
    
    // Set virtual camera viewport
    renderer.setViewport(0, height-vcHeidth-50, vcWidth, vcHeidth);
    renderer.render(scene, virtualCamera);    
  }

  function render()
  {
    trackballControls.update();
    controlledRender();
    requestAnimationFrame(render);
  }
}