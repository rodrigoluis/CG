import * as THREE from '../../build/three.module.js';
//import * as TWEEN from '../../libs/other/Tween.min.js';
import {GUI} from       '../../build/jsm/libs/dat.gui.module.js';
import Stats from       '../../build/jsm/libs/stats.module.js';
import {TrackballControls} from '../../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera,
        InfoBox,
        onWindowResize} from "../../libs/util/util.js";

var stats = new Stats();          
var scene = new THREE.Scene();    //Cria a cena no plano
var renderer = initRenderer();    // Função para rendenizar as parada
var camera = initCamera(new THREE.Vector3(0, -30, 15)); //Inicia a camera
        
// Função pra usar o mouse
var trackballControls = new TrackballControls( camera, renderer.domElement );

// set initial info
var xAxis = 0.0;
var yAxis = 0.0;
var zAxis = 1.0;
var move = false;
        
// Cria o plano
var planeGeometry = new THREE.PlaneGeometry(25, 25); //Plano 25x25
var planeMaterial = new THREE.MeshBasicMaterial({
    color: "rgba(150,150,150)",
    side: THREE.DoubleSide,
});

var plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);
        
// create and position sphere
var sphereGeometry = new THREE.SphereGeometry(1.0, 25, 25);
var sphereMaterial = new THREE.MeshBasicMaterial({
    color: "rgba(255,0,0)",
});
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(10.0, -10.0, 1.0);
scene.add(sphere);
        
// animation
function animateSphere() {
    sphere.matrixAutoUpdate = false;
    sphere.matrix.identity();
     
    var mat4 = new THREE.Matrix4();
    sphere.matrix.multiply(mat4.makeTranslation(0.0, 0.0, 1.0));

    if(move){
        sphere.matrix.multiply(mat4.makeTranslation(xAxis,yAxis,0.0));
    }
}

function buildInterface() {

    var controls = new function() {
  
      this.move = function(){
        move = !move;
      };
  
      this.xAxis = 0;
      this.yAxis = 0;
  
      this.setXAxis = function() {
        xAxis = this.xAxis;
      }
      this.setYAxis = function() {
        yAxis = this.yAxis;
      }
    }
  
    // GUI interface
    var gui = new GUI();
    gui.add(controls, 'xAxis', -11.5, 11.5)
      .onChange(function(e) { controls.setXAxis() })
      .name("Set X Axis");
    gui.add(controls, 'yAxis', -11.5, 11.5)
      .onChange(function(e) { controls.setYAxis() })
      .name("Set Y Axis");
    gui.add(controls, 'move',false).name("Mover");
  }
  
                
// Use this to show information onscreen
var controls = new InfoBox();
controls.add("Basic Scene");
controls.addParagraph();
controls.add("Use mouse to interact:");
controls.add("* Left button to rotate");
controls.add("* Right button to translate (pan)");
controls.add("* Scroll to zoom in/out.");
controls.show();
        
// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
        
buildInterface();  
render();
        
        
function render()
{
    stats.update(); // Update FPS
    trackballControls.update(); // Enable mouse movements
    animateSphere();
    requestAnimationFrame(render);
    renderer.render(scene, camera) // Render scene
}