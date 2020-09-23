function main()
{
  var scene = new THREE.Scene();    // Create main scene
  var renderer = initRenderer();    // View function in util/utils
  var camera = initCamera(new THREE.Vector3(15, 15, 15)); // Init camera

  // create a cube
  var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
  var cubeMaterial = new THREE.MeshNormalMaterial();
  var cube = new THREE.Mesh(cubeGeometry, cubeMaterial); // position the cube
  cube.position.set(0.0, 0.0, 0.0); // add the cube to the scene
  scene.add(cube);

  render();
  function render()
  {
    requestAnimationFrame(render);
    renderer.render(scene, camera) // Render scene
  }
}
