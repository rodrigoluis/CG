// Based on the "vehicle" example available in https://github.com/kripken/ammo.js/

import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera, 
        initDefaultBasicLight,
		onWindowResize,
		degreesToRadians} from "../libs/util/util.js";

// global variables
var TRANSFORM_AUX = null;
var ZERO_QUATERNION = new THREE.Quaternion(0, 0, 0, 1);

// Graphics variables
var clock = new THREE.Clock();
var speedometer;

// Setup scene
var scene = new THREE.Scene();
var renderer = initRenderer();
	renderer.setClearColor( 0xbfd1e5 )
var camera = initCamera(new THREE.Vector3(-40, 25, 0)); // Init camera in this position
var light = initDefaultBasicLight(scene, true, new THREE.Vector3(-60, 40, -20), 120, 1024, 0.1, 150) ;

// Helper, if necessary
//var spotHelper = new THREE.CameraHelper(light.shadow.camera, 0xFF8C00);
//scene.add(spotHelper); 

var controls = new OrbitControls( camera, renderer.domElement);
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
window.addEventListener( 'keydown', keydown);
window.addEventListener( 'keyup', keyup);
speedometer = document.getElementById( 'speedometer' );

var stats = new Stats();
document.getElementById("webgl-output").appendChild(stats.domElement);

var materialDynamic = new THREE.MeshPhongMaterial( { color: "rgba(255, 160, 0)" } );
var materialGround = new THREE.MeshPhongMaterial({ color: "rgb(180, 180, 180)" });

// mesh
var materialRamp = new THREE.MeshLambertMaterial( {
    color: "rgb(120, 120, 200)",
    polygonOffset: true,
    polygonOffsetFactor: 0.5, // positive value pushes polygon further away
    polygonOffsetUnits: 2
} );

//var materialRamp = new THREE.MeshPhongMaterial( { color: "rgb(120, 120, 200)" } );	
var materialInteractive = new THREE.MeshPhongMaterial( { color: "rgb(255, 50, 50)" } );
var materialWheels = new THREE.MeshPhongMaterial( { color: "rgb(30, 30, 30)" } );	
var materialWheels2 = new THREE.MeshPhongMaterial( { color: "rgb(200, 200, 200)" } );	

// Physics variables
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var physicsWorld;

var syncList = [];
var time = 0;

// Keybord actions
var actions = {};
var keysActions = {
	"ArrowUp":'acceleration',
	"ArrowDown":'braking',
	"ArrowLeft":'left',
	"ArrowRight":'right'
};

// Start physics
Ammo().then(function() {
	initPhysics();
	createObjects();	
	render();
});

// Main loop
function render() {
	var dt = clock.getDelta();
	for (var i = 0; i < syncList.length; i++)
		syncList[i](dt);
	physicsWorld.stepSimulation( dt, 10 );
	controls.update( dt );
	time += dt;
	stats.update();	
	requestAnimationFrame( render );
	renderer.render( scene, camera );	
}

function initPhysics() {
	// Physics configuration
	collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
	broadphase = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
	physicsWorld.setGravity( new Ammo.btVector3( 0, -9.82, 0 ) );
}

function keyup(e) {
	if(keysActions[e.code]) {
		actions[keysActions[e.code]] = false;
		e.preventDefault();
		e.stopPropagation();
		return false;
	}
}
function keydown(e) {
	if(keysActions[e.code]) {
		actions[keysActions[e.code]] = true;
		e.preventDefault();
		e.stopPropagation();
		return false;
	}
}

function setGroundTexture(mesh)
{
	var textureLoader = new THREE.TextureLoader();
	textureLoader.load( "../assets/textures/grid.png", function ( texture ) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 60, 60 );
		mesh.material.map = texture;
		mesh.material.needsUpdate = true;
	} );
}

function createWireFrame(mesh)
{	
	// wireframe
	var geo = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
	var mat = new THREE.LineBasicMaterial( { color: "rgb(80, 80, 80)", linewidth: 1.5} );
	var wireframe = new THREE.LineSegments( geo, mat );
	mesh.add( wireframe );
}

function createObjects() {
	// Ground plane
	var ground = createBox(new THREE.Vector3(0, -0.5, 0), ZERO_QUATERNION, 100, 1, 100, 0, 2, materialGround, true);
	setGroundTexture(ground);

	// Ramps
	var quaternion = new THREE.Quaternion(0, 0, 0, 1);
	var ramp;
	quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), degreesToRadians(-15));
	ramp = createBox(new THREE.Vector3(0, -1.5, 0), quaternion, 8, 4, 10, 0, 0, materialRamp);
	createWireFrame(ramp);
	quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), degreesToRadians(30));	
	ramp = createBox(new THREE.Vector3(25, -3.0, 0), quaternion, 8, 8, 15, 0, 0, materialRamp);	
	createWireFrame(ramp);	
	quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), degreesToRadians(-5));	
	ramp = createBox(new THREE.Vector3(-25, -1.5, 0), quaternion, 8, 4, 15, 0, 0, materialRamp);	
	createWireFrame(ramp);	

	// Boxes
	var size = .75, nw = 8, nh = 7;
	for (var j = 0; j < nw; j++)
		for (var i = 0; i < nh; i++)
			createBox(new THREE.Vector3(size * j - (size * (nw - 1)) / 2, size * i, 11), ZERO_QUATERNION, size, size, size, 10, 1, materialDynamic);

	// Vehicle
	createVehicle(new THREE.Vector3(0, 4, -20), ZERO_QUATERNION);
}

function createBox(pos, quat, w, l, h, mass = 0, friction = 1, material, receiveShadow = false) {
	if(!TRANSFORM_AUX)
		TRANSFORM_AUX = new Ammo.btTransform();
	var shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1);
	var geometry = new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));

	var mesh = new THREE.Mesh(shape, material);
		mesh.castShadow = true;
		mesh.receiveShadow = receiveShadow;
	mesh.position.copy(pos);
	mesh.quaternion.copy(quat);
	scene.add( mesh );

	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
	transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
	var motionState = new Ammo.btDefaultMotionState(transform);

	var localInertia = new Ammo.btVector3(0, 0, 0);
	geometry.calculateLocalInertia(mass, localInertia);

	var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
	var body = new Ammo.btRigidBody(rbInfo);
	body.setFriction(friction);

	physicsWorld.addRigidBody( body );

	if (mass > 0) {
		// Sync physics and graphics
		function sync(dt) {
			var ms = body.getMotionState();
			if (ms) {
				ms.getWorldTransform(TRANSFORM_AUX);
				var p = TRANSFORM_AUX.getOrigin();
				var q = TRANSFORM_AUX.getRotation();
				mesh.position.set(p.x(), p.y(), p.z());
				mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
			}
		}
		syncList.push(sync);
	}
	return mesh;
}

function createWheelMesh(radius, width) {
	var t = new THREE.CylinderGeometry(radius, radius, width, 24, 1);
	t.rotateZ(Math.PI / 2);
	var mesh = new THREE.Mesh(t, materialWheels);
		mesh.castShadow = true;
	mesh.add(new THREE.Mesh(new THREE.BoxGeometry(width * 1.5, radius * 1.75, radius*.25, 1, 1, 1), materialWheels2));
	scene.add(mesh);
	return mesh;
}

function createChassisMesh(w, l, h) {
	var shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1);
	var mesh = new THREE.Mesh(shape, materialInteractive);
		mesh.castShadow = true;	
	scene.add(mesh);
	return mesh;
}

function createVehicle(pos, quat) {
	// Vehicle contants
	var chassisWidth = 2.0;
	var chassisHeight = 1.0;
	var chassisLength = 4.2;
	var massVehicle = 1000;

	var wheelRadiusFront = .4;
	var wheelWidthFront = .4;
	var wheelAxisFrontPosition = 1.6;
	var wheelHalfTrackFront = 1.2;
	var wheelAxisHeightFront = .2;

	var wheelRadiusBack = .5;
	var wheelWidthBack = .5;
	var wheelAxisPositionBack = -1.3;
	var wheelHalfTrackBack = 1.25;
	var wheelAxisHeightBack = 0.1;

	var friction = 1000;
	var suspensionStiffness = 25.0;
	var suspensionDamping = 2.3;
	var suspensionCompression = 5.0;
	var suspensionRestLength = 0.7;
	var rollInfluence = 0.2;

	var steeringIncrement = .04;
	var steeringClamp = .5;
	var maxEngineForce = 1500;
	var maxBreakingForce = 100;

	// Chassis
	var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
	transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
	var motionState = new Ammo.btDefaultMotionState(transform);
	var localInertia = new Ammo.btVector3(0, 0, 0);
	geometry.calculateLocalInertia(massVehicle, localInertia);
	var body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia));
	physicsWorld.addRigidBody(body);
	var chassisMesh = createChassisMesh(chassisWidth, chassisHeight, chassisLength);

	// Raycast Vehicle
	var engineForce = 0;
	var vehicleSteering = 0;
	var breakingForce = 0;
	var tuning = new Ammo.btVehicleTuning();
	var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
	var vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
	vehicle.setCoordinateSystem(0, 1, 2);
	physicsWorld.addAction(vehicle);

	// Wheels
	var FRONT_LEFT = 0;
	var FRONT_RIGHT = 1;
	var BACK_LEFT = 2;
	var BACK_RIGHT = 3;
	var wheelMeshes = [];
	var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
	var wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

	function addWheel(isFront, pos, radius, width, index) {

		var wheelInfo = vehicle.addWheel(
				pos,
				wheelDirectionCS0,
				wheelAxleCS,
				suspensionRestLength,
				radius,
				tuning,
				isFront);

		wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
		wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
		wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
		wheelInfo.set_m_frictionSlip(friction);
		wheelInfo.set_m_rollInfluence(rollInfluence);

		wheelMeshes[index] = createWheelMesh(radius, width);
	}

	addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
	addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
	addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_LEFT);
	addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_RIGHT);

	// Sync keybord actions and physics and graphics
	function sync(dt) {
		var speed = vehicle.getCurrentSpeedKmHour();
		speedometer.innerHTML = (speed < 0 ? '(R) ' : '') + Math.abs(speed).toFixed(1) + ' km/h';
		breakingForce = 0;
		engineForce = 0;

		if (actions.acceleration) {
			if (speed < -1)
				breakingForce = maxBreakingForce;
			else engineForce = maxEngineForce;
		}
		if (actions.braking) {
			if (speed > 1)
				breakingForce = maxBreakingForce;
			else engineForce = -maxEngineForce / 2;
		}
		if (actions.left) {
			if (vehicleSteering < steeringClamp)
				vehicleSteering += steeringIncrement;
		}
		else {
			if (actions.right) {
				if (vehicleSteering > -steeringClamp)
					vehicleSteering -= steeringIncrement;
			}
			else {
				if (vehicleSteering < -steeringIncrement)
					vehicleSteering += steeringIncrement;
				else {
					if (vehicleSteering > steeringIncrement)
						vehicleSteering -= steeringIncrement;
					else {
						vehicleSteering = 0;
					}
				}
			}
		}
		vehicle.applyEngineForce(engineForce, BACK_LEFT);
		vehicle.applyEngineForce(engineForce, BACK_RIGHT);

		//vehicle.setBrake(breakingForce, FRONT_LEFT);
		//vehicle.setBrake(breakingForce, FRONT_RIGHT);
		vehicle.setBrake(breakingForce, BACK_LEFT);
		vehicle.setBrake(breakingForce, BACK_RIGHT);

		vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
		vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);

		var tm, p, q, i;
		var n = vehicle.getNumWheels();
		for (i = 0; i < n; i++) {
			vehicle.updateWheelTransform(i, true);
			tm = vehicle.getWheelTransformWS(i);
			p = tm.getOrigin();
			q = tm.getRotation();
			wheelMeshes[i].position.set(p.x(), p.y(), p.z());
			wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w());
		}

		tm = vehicle.getChassisWorldTransform();
		p = tm.getOrigin();
		q = tm.getRotation();
		chassisMesh.position.set(p.x(), p.y(), p.z());
		chassisMesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
	}
	syncList.push(sync);
}
