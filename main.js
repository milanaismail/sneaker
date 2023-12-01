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
  gltf.scene.position.set(0, 0.06, 0)
  gltf.scene.rotation.set(0, -65 * (Math.PI / 180), 0)
  gltf.scene.scale.set(3, 3, 3);
  scene.add(gltf.scene);
}, undefined, function(error){
  console.error(error);
});

//add orbit to shoe only

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

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
	},
	// called when loading is in progresses
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

	});

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00  } );

//add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

//add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

//add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 15, 4);
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