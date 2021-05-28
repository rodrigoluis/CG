import * as THREE from '../build/three.module.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import { ARButton } from 	 '../build/jsm/webxr/ARButton.js';
import {initDefaultSpotlight,
		onWindowResize} from "../libs/util/util.js";

//-------------------------------------------------------------------------------------------------
let container;
let camera, scene, renderer;
let controller;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;

container = document.createElement( 'div' );
document.body.appendChild( container );
window.addEventListener( 'resize', onWindowResize );

scene = new THREE.Scene();
initDefaultSpotlight(scene, new THREE.Vector3(2, 4, 2));
camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

//
renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;
container.appendChild( renderer.domElement );

//
document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );

// Teapot
const size = 0.1;
var geometry = new TeapotGeometry(0.1);

controller = renderer.xr.getController( 0 );
controller.addEventListener( 'select', onSelect);
scene.add( controller );

reticle = new THREE.Mesh(
	new THREE.RingGeometry( 0.12, 0.15, 32 ).rotateX( - Math.PI / 2 ),
	new THREE.MeshBasicMaterial()
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add( reticle );

// Start rendering loop
renderer.setAnimationLoop( render );

function onSelect() 
{
	if ( reticle.visible ) addTeapot();
}

function addTeapot()
{
	const material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
	const mesh = new THREE.Mesh( geometry, material );
	mesh.position.setFromMatrixPosition( reticle.matrix );
	mesh.translateY(size); // To put the teapot over the rectile
	scene.add( mesh );
}

function render( timestamp, frame ) {

	if ( frame ) 
	{
		const referenceSpace = renderer.xr.getReferenceSpace();
		const session = renderer.xr.getSession();

		if ( hitTestSourceRequested === false ) {
			session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
				session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
					hitTestSource = source;
				} );
			} );

			session.addEventListener( 'end', function () {
				hitTestSourceRequested = false;
				hitTestSource = null;
			} );
			hitTestSourceRequested = true;
		}

		if ( hitTestSource ) {

			const hitTestResults = frame.getHitTestResults( hitTestSource );
			if ( hitTestResults.length ) {
				const hit = hitTestResults[ 0 ];
				reticle.visible = true;
				reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
			} else {
				reticle.visible = false;
			}
		}
	}
	renderer.render( scene, camera );
}

