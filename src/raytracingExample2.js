function main()
{
		var controls, scene, renderer;

		var container = document.createElement( 'div' );
		document.body.appendChild( container );

		var scene = new THREE.Scene();

		// The canvas is in the XY plane.
		// Hint: put the camera in the positive side of the Z axis and the
		// objects in the negative side
		var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
		camera.position.z = 600;
		camera.position.y = 250;

		renderer = new THREE.RaytracingRenderer(window.innerWidth, window.innerHeight, 32, camera);
		container.appendChild( renderer.domElement );

		// materials
		var phongMaterialBox = new THREE.MeshLambertMaterial( {
			color: "rgb(255,255,255)",
		} );

		var phongMaterialBoxBottom = new THREE.MeshLambertMaterial( {
			color: "rgb(180,180,180)",
		} );

		var phongMaterialBoxLeft = new THREE.MeshLambertMaterial( {
			color: "rgb(200,0,0)",
		} );

		var phongMaterialBoxRight = new THREE.MeshLambertMaterial( {
			color: "rgb(0,200,0)",
		} );

		var phongMaterial = new THREE.MeshPhongMaterial( {
			color: "rgb(150,190,220)",
			specular: "rgb(255,255,255)",
			shininess: 1000,
			} );

		var mirrorMaterial = new THREE.MeshPhongMaterial( {
			color: "rgb(0,0,0)",
			specular: "rgb(255,255,255)",
			shininess: 1000,
		} );
		mirrorMaterial.mirror = true;
		mirrorMaterial.reflectivity = 1;

		var mirrorMaterialDark = new THREE.MeshPhongMaterial( {
			color: "rgb(0,0,0)",
			specular: "rgb(170,170,170)",
			shininess: 10000,
		} );
		mirrorMaterialDark.mirror = true;
		mirrorMaterialDark.reflectivity = 1;

		var mirrorMaterialSmooth = new THREE.MeshPhongMaterial( {
			color: "rgb(255,170,0)",
			specular: "rgb(34,34,34)",
			shininess: 10000,
		} );
		mirrorMaterialSmooth.mirror = true;
		mirrorMaterialSmooth.reflectivity = 0.1;

		var glassMaterialSmooth = new THREE.MeshPhongMaterial( {
			color: "rgb(0,0,0)",
			specular: "rgb(255,255,255)",
			shininess: 10000,
		} );
		glassMaterialSmooth.glass = true;
		glassMaterialSmooth.reflectivity = 0.25;
		glassMaterialSmooth.refractionRatio = 1.5;

		// geometries
		var torusGeometry = new THREE.TorusKnotGeometry( 150 );
		var sphereGeometry = new THREE.SphereGeometry( 100, 24, 24 );
		var planeGeometry = new THREE.BoxGeometry( 600, 5, 600 );
		var backMirrorGeometry = new THREE.BoxGeometry( 450, 5, 300 );
		var boxGeometry = new THREE.BoxGeometry( 100, 100, 100 );

		// Sphere
		sphere = new THREE.Mesh( sphereGeometry, phongMaterial );
		sphere.scale.multiplyScalar( 0.5 );
		sphere.position.set( -50, 0, -75 );
		scene.add( sphere );

		// Mirror Sphere
		sphere2 = new THREE.Mesh( sphereGeometry, mirrorMaterialSmooth );
		sphere2.scale.multiplyScalar( 0.8 );
		sphere2.position.set( 175, 30, -150 );
		scene.add( sphere2 );

		// Glass Sphere (black-right-front)
		glass = new THREE.Mesh( sphereGeometry, glassMaterialSmooth );
		glass.scale.multiplyScalar( 0.5 );
		glass.position.set( 120, 0, -50 );
		glass.rotation.y = 0.6;
		scene.add( glass );

		// Box
		box = new THREE.Mesh( boxGeometry, mirrorMaterial );
		box.position.set( -175, 0, -190 );
		box.rotation.y = degreesToRadians(37);
		scene.add( box );

		// bottom
		plane = new THREE.Mesh( planeGeometry, phongMaterialBoxBottom );
		plane.position.set( 0, -50, -300 );
		scene.add( plane );

		// top
		plane = new THREE.Mesh( planeGeometry, phongMaterialBox );
		plane.position.set( 0, 550, -300 );
		scene.add( plane );

		// back
		plane = new THREE.Mesh( planeGeometry, phongMaterialBox );
		plane.rotation.x = 1.57;
		plane.position.set( 0, 250, -300 );
		scene.add( plane );

		// Back Mirror
		backmirror = new THREE.Mesh( backMirrorGeometry, mirrorMaterialDark );
		backmirror.rotation.x = 1.57;
		backmirror.position.set( 0, 150, -290 );
		backmirror.scale.multiplyScalar( 0.95 );
		scene.add( backmirror );

		// left
		plane = new THREE.Mesh( planeGeometry, phongMaterialBoxLeft );
		plane.rotation.z = 1.57;
		plane.position.set( -300, 250, -300 )
		scene.add( plane );

		// right
		plane = new THREE.Mesh( planeGeometry, phongMaterialBoxRight );
		plane.rotation.z = 1.57;
		plane.position.set( 300, 250, -300 )
		scene.add( plane );

		// light
		var intensity = 0.5;
		var light = new THREE.PointLight( 0xffffff, intensity );
		light.position.set( 0, 250, 0 );
		scene.add( light );

		var light = new THREE.PointLight( 0x55aaff, intensity );
		light.position.set( -100, 150, 200 );
		scene.add( light );

		var light = new THREE.PointLight( 0xffffff, intensity );
		light.position.set( 100, 150, 200 );
		scene.add( light );

		render();

		function render()
		{
			renderer.render( scene, camera );
		}
}
