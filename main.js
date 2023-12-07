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
const raycaster = new THREE.Raycaster();
raycaster.precision = 0.1; // Adjust the value as needed
raycaster.params.Points.threshold = 0.1; // Adjust the value as needed

const pointer = new THREE.Vector2();
//add audio 
const listener = new THREE.AudioListener();
camera.add( listener );

// create a global audio source
const sound = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( '/sounds/Click.mp3', function( buffer ) {
  sound.setBuffer( buffer );
  sound.setVolume( 0.5 );
});

const onPointerMove = ( event ) => {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

window.addEventListener( 'pointermove', onPointerMove );

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

let shoe;

//add public/Shoe_compressed.glb 
loader.load('public/Shoe_compressed.glb', function(gltf){
  shoe = gltf.scene;
  shoe.position.set(0.05, 0.10, -0.04)
  shoe.rotation.set(0, -65 * (Math.PI / 180), 0)
  shoe.scale.set(3, 3, 3);
  shoe.receiveShadow = true; 
  scene.add(shoe);
  shoe.rotation.set(0, -65 * (Math.PI / 180), 0)
  shoe.traverse(function(node){
    if (node.isMesh){
      node.castShadow = true;
    }
  }) 
});

let isDragging = false;
let previousMouseX = 0;

// Event listener for mouse movement
document.addEventListener('mousedown', (event) => {
  isDragging = true;
  previousMouseX = event.clientX;
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

document.addEventListener('mousemove', (event) => {
  if (isDragging && shoe) {
    const delta = event.clientX - previousMouseX;
    previousMouseX = event.clientX;

    // Rotate the shoe based on mouse movement
    shoe.rotation.y += delta * 0.01; // You can adjust the sensitivity here
  }
});

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

const texture = new THREE.TextureLoader().load('textures/normal2.png');
const material2 = new THREE.MeshStandardMaterial({ 
  map: texture,
  metalness: 0.5,
  roughness: 0.2,
 });

/*const objLoader = new OBJLoader();

objLoader.load(
	// resource URL
	'public/old_oil_barrel.obj',
	// called when resource is loaded
	function ( barrel ) {
		scene.add( barrel );
    barrel.scale.set(0.52, 0.52, 0.52);
    barrel.position.set(0, -3.55, -0.6);
    //add material2
    barrel.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = material2;
        child.receiveShadow = true;
        child.castShadow = true;
      }
    });
	});
*/
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00  } );

//add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

//add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff,1.2);
scene.add(ambientLight);

//add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 15, 4);
directionalLight.target.position.set(0, 0, 0);
//add shadow
directionalLight.castShadow = true;
scene.add(directionalLight);

//add helper
const helper = new THREE.DirectionalLightHelper(directionalLight, 5); 
scene.add(helper);

camera.position.z = 2; //zoom in van 2 naar 1
camera.position.y = 0.65;
camera.lookAt(0, -1, 0);

let name = document.getElementById('name');
const paletteLaces = document.getElementById('color-palette-laces');


const clock = new THREE.Clock();

// Function to change the color of the laces
function changeLacesColor(color) {
  if (scene) {
    const lacesMesh = scene.children[4].children[0].children[1];
    if (lacesMesh.name === "laces") {
      lacesMesh.material.color.set(color);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  const speed = elapsedTime * 0.1;

  // Update raycaster position based on mouse movement
  raycaster.setFromCamera(pointer, camera);

  // Raycast to find intersected objects
  const intersects = raycaster.intersectObjects(scene.children, true);

  // Flag to track whether an intersected mesh has been found
  let meshFound = false;

  // Reset color for all objects
  scene.traverse((node) => {
    if (node.isMesh) {
      node.material.color.set("#ffffff");
    }
  });

  // Change color for the first intersected mesh
  for (const intersect of intersects) {
    if (intersect.object.isMesh && !meshFound) {
      intersect.object.material.color.set("#69ff47");
      meshFound = true;

      // Handle click event
      window.addEventListener('click', function () {
        // Look at the clicked object
        camera.lookAt(intersect.object.position);

        // Set camera position based on the clicked object
        camera.position.z = 0;
        camera.position.x = 1; // Adjust as needed
        camera.position.y = 1; // Adjust as needed

        // Handle different parts of the shoe
        if (intersect.object.name === "laces") {
          name.innerHTML = "Laces";
          paletteLaces.style.display = "flex";

          // Call the function to change the laces color when clicked on the palette
          paletteLaces.addEventListener('click', function () {
            changeLacesColor("red"); // Change the color as needed
          });
        } else if (intersect.object.name === "sole_bottom") {
          name.innerHTML = "Sole Bottom";
          paletteLaces.style.display = "none";
        }
      });
    }
  }

  renderer.render(scene, camera);
}

animate();

