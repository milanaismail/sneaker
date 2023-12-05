import './style.css';
import * as THREE from 'three';

//import orbit controls
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

//import gftloader
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

//import draco loader
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

//import axes helper
import { AxesHelper } from 'three';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );

scene.background = new THREE.CubeTextureLoader()
	.setPath( 'textures/cubeMap/' )
	.load( [
				'px.png',
				'nx.png',
				'py.png',
				'ny.png',
				'pz.png',
				'nz.png'
			] );


//add axes helper
const axesHelper = new AxesHelper( 5 );
scene.add( axesHelper );

//add gltf loader
const loader = new GLTFLoader();

//add draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

//add public/Shoe_compressed.glb 
loader.load('public/Shoe_compressed.glb', function(gltf){
  gltf.scene.position.set(0.1, 0.10, -0.04)
  gltf.scene.rotation.set(0, -65 * (Math.PI / 180), 0)
  gltf.scene.scale.set(3, 3, 3);
  gltf.scene.castShadow = true;
  scene.add(gltf.scene);
  gltf.scene.receiveShadow = true;
});


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

renderer.shadowMap.enabled = true;

const objLoader = new OBJLoader();

objLoader.load(
	// resource URL
	'public/old_oil_barrel.obj',
	// called when resource is loaded
	function ( object ) {

		scene.add( object );
    object.scale.set(0.52, 0.52, 0.52);
    object.position.set(0, -3.55, -0.6);
    //make object smaller
	});

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00  } );

//add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

//add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff,1.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x0000ff, 0.2);
scene.add(pointLight);
pointLight.castShadow = true;
pointLight.position.set(0, 0, -0.2);

//add point light helper
const pointLightHelper = new THREE.PointLightHelper(pointLight);
scene.add(pointLightHelper);

// optional light

//add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 15, 4);
directionalLight.castShadow = true;
scene.add(directionalLight);

//add helper
const helper = new THREE.DirectionalLightHelper(directionalLight, 5); 
scene.add(helper);

camera.position.z = 1; //zoom in van 2 naar 1
camera.position.y = 0.4;

//camera position to screen
camera.lookAt(0, 0, 0);



function animate() {
	requestAnimationFrame( animate );

	renderer.render( scene, camera );
}

animate();