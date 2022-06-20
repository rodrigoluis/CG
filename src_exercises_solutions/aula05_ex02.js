/*
Aluno: BRUNO BERBERT DE CARVALHO
Período: 2020.3
Aula: Animação - Exercício 2
*/

import * as THREE from  '../build/three.module.js';
import Stats from '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera, 
        degreesToRadians, 
        onWindowResize,
        initDefaultSpotlight,
        createGroundPlane,
        lightFollowingCamera} from "../libs/util/util.js";

  const stats = new Stats();
  var scene = new THREE.Scene();    // Create main scene
  var renderer = initRenderer();    // View function in util/utils
  var camera = initCamera(new THREE.Vector3(0, -30, 15)); // Init camera in this position

  var lightPosition = new THREE.Vector3(18, -18, 20);
  var light = initDefaultSpotlight(scene, lightPosition); // Use default light

  // Initial Sphere Position
  var spherePos = new THREE.Vector3(10.0, -10.0, 1.0);

  // Inital Target Sphere Position
  var targetPos = new THREE.Vector3(0, 0, 1.0);

  // Enable mouse rotation, pan, zoom etc.
  var trackballControls = new TrackballControls(camera, renderer.domElement);

  // Create Ground Plane
  var groundPlane = createGroundPlane(25, 25); // width and height
  scene.add(groundPlane);

  // Create Sphere
  var sphereGeometry = new THREE.SphereGeometry(1, 50, 50);
  var sphereMaterial = new THREE.MeshLambertMaterial({ color: "rgb(255,20,20)" });
  var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true; // enable shadow
  sphere.position.set(spherePos.x, spherePos.y, spherePos.z); // set initial position of the sphere
  scene.add(sphere); // add the sphere to the scene

  // Listen window size changes
  window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

  buildInterface2();
  buildInterface();
  updateSpherePosition();
  render();

  // used to instantly change sphere position using sliders
  function updateSpherePosition() {

    sphere.matrixAutoUpdate = false; // Disable autoUpdate on sphere matrix

    var mat4 = new THREE.Matrix4();

    sphere.matrix.identity();

    sphere.matrix.multiply(mat4.makeTranslation(spherePos.x, spherePos.y, spherePos.z)); // T1

  }

  // If true, enable the animation to move the sphere to target position
  var animationOn = false;

  // If true, smooth sphere movement. If false, constant sphere movement
  var smooth = true;

  // How fast the ball will move (lower is faster)
  var speedFactor = 50;

  var distX, distY, distZ;

  var speedX, speedY, speedZ;

  function updateDistToTarget() {
    distX = spherePos.x - targetPos.x;
    distY = spherePos.y - targetPos.y;
    distZ = spherePos.z - targetPos.z;
  }

  function updateSpeedToTarget() {
    speedX = distX / speedFactor;
    speedY = distY / speedFactor;
    speedZ = distZ / speedFactor;
  }

  updateDistToTarget(); // update distance to initial position
  updateSpeedToTarget(); // update speed to initial position

  // Move the sphere to target if animationOn = true
  function moveToTarget() {

    sphere.matrixAutoUpdate = false; // Disable autoUpdate on sphere matrix

    if (animationOn) {

      // if smooth = true, aways update speed.
      // So the closest to target position, slowest the sphere moves
      if (smooth) {
        updateDistToTarget();
        updateSpeedToTarget();
        spherePos.x -= speedX;
        spherePos.y -= speedY;
        spherePos.z -= speedZ;
      }

      // Constant sphere speed
      else {
        updateDistToTarget();
        spherePos.x -= speedX;
        spherePos.y -= speedY;
        spherePos.z -= speedZ;
      }

      var mat4 = new THREE.Matrix4();

      sphere.matrix.identity();

      sphere.matrix.multiply(mat4.makeTranslation(spherePos.x, spherePos.y, spherePos.z)); // Apply the translation

      // If its really close to target position, animation stops
      if (Math.abs(distX) <= 0.01 && Math.abs(distY) <= 0.01 && Math.abs(distZ) <= 0.01) {
        //alert("Chegou ao ponto destino");
        animationOn = false;
      }

    }

  }

  function buildInterface() {
    var controls = new function () {
      this.posX = spherePos.x;
      this.posY = spherePos.y;
      this.posZ = spherePos.z;
      this.movType = 'Smooth';

      this.move = function () {
        spherePos.x = this.posX;
        spherePos.y = this.posY;
        spherePos.z = this.posZ;
        animationOn = false;
        updateSpherePosition();
        updateDistToTarget();
        updateSpeedToTarget();
      };

      this.onChangeType = function () {
        switch (this.movType) {
          case 'Smooth':
            smooth = true;
            break;
          case 'Constant':
            smooth = false;
            break;
        }
      };

    };

    // GUI interface
    var gui = new GUI();

    gui.add(controls, 'posX', -12, 12)
      .onChange(function (e) { controls.move() })
      .name("Sphere X Position");

    gui.add(controls, 'posY', -12, 12)
      .onChange(function (e) { controls.move() })
      .name("Sphere Y Position");

    gui.add(controls, 'posZ', 1, 12)
      .onChange(function (e) { controls.move() })
      .name("Sphere Z Position");

    gui.add(controls, 'movType', ['Smooth', 'Constant'])
      .name("Movement Type")
      .onChange(function (e) { controls.onChangeType() });

  }

  function buildInterface2() {
    var controls = new function () {
      this.posX = targetPos.x;
      this.posY = targetPos.y;
      this.posZ = targetPos.z;

      this.move = function () {
        targetPos.x = this.posX;
        targetPos.y = this.posY;
        targetPos.z = this.posZ;
        animationOn = false;
        updateDistToTarget();
        updateSpeedToTarget();
      };

    };

    var moveBtn = {
      add: function () {
        animationOn = !animationOn;
      }
    };

    // GUI interface
    var gui = new GUI();

    gui.add(controls, 'posX', -12, 12)
      .onChange(function (e) { controls.move() })
      .name("Target X Position");

    gui.add(controls, 'posY', -12, 12)
      .onChange(function (e) { controls.move() })
      .name("Target Y Position");

    gui.add(controls, 'posZ', 1, 12)
      .onChange(function (e) { controls.move() })
      .name("Target Z Position");

    gui.add(moveBtn, "add").name("Mover");

  }

  function render() {
    stats.update(); // Update FPS
    trackballControls.update();
    moveToTarget();
    requestAnimationFrame(render); // Show events
    renderer.render(scene, camera) // Render scene
  }
