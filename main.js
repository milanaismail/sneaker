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

import clickSoundUrl from '/sounds/click.mp3';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );
const raycaster = new THREE.Raycaster();
raycaster.precision = 0.1; // Adjust the value as needed
raycaster.params.Points.threshold = 0.1; // Adjust the value as needed

const pointer = new THREE.Vector2();
//add audio 

const audioLoader = new THREE.AudioLoader();

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.PositionalAudio(listener);
function loadAudio() {
  // load audio only after a user gesture (e.g., click)
  audioLoader.load(clickSoundUrl, function(buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sound.setRefDistance(5); // Adjust the reference distance as needed
    scene.add(sound);

    // now that the audio is loaded, you can play it
    playClickSound();
  });
}


function playClickSound() {
  sound.play();
}

window.addEventListener('click', loadAudio);

const onPointerMove = ( event ) => {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

window.addEventListener( 'pointermove', onPointerMove );
/*
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
*/
      /*const textureLoader = new THREE.TextureLoader();
      const background = textureLoader.load('/textures/background.jpeg'); // Replace with the path to your image
      
      // Create a plane geometry
      const planeGeometry = new THREE.PlaneGeometry(12, 12); // Adjust the size as needed
      
      // Create a material with the texture
      const planeMaterial = new THREE.MeshBasicMaterial({ map: background });
      
      // Create a mesh with the geometry and material
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      
      // Add the mesh to the scene
      scene.add(plane);     
      plane.position.z = -2; // Adjust as needed*/

      //Add gridhelper
      const size = 50;
      const divisions = 50;
      const gridHelper = new THREE.GridHelper( size, divisions );

      scene.add( gridHelper );

      gridHelper.position.y = -1;

      //change color of gridhelper
      gridHelper.material.color.set(0xffffff);
      // change width of gridhelper
      gridHelper.material.linewidth = 3;

      
//add plane
const planeGeometry = new THREE.PlaneGeometry(50, 50, 20, 20);

// Custom shader material for the gradient effect
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float time;

  void main() {
    vec3 color = vec3(0.0, 0.0, 0.5);  // Initial color, adjust as needed
    float gradient = vUv.x + sin(time + vUv.y * 10.0) * 0.1;  // Create a gradient effect with some vertical movement
    color.b = smoothstep(0.0, 0.1, gradient);  // Blue component
    color.r = smoothstep(0.4, 0.5, gradient);  // Purple component

    gl_FragColor = vec4(color, 1.0);
  }
`;

const planeMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
  uniforms: {
    time: { value: 0.0 },
  }
});

const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);
plane.rotation.x = Math.PI / 2;
plane.position.y = -1.05;



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

const shoeMeshes = [];

//add public/Shoe_compressed.glb 
loader.load('public/Shoe_compressed.glb', function(gltf){
  shoe = gltf.scene;
  shoe.position.set(0.05, 0.10, -0.04)
  shoe.rotation.set(0, -65 * (Math.PI / 180), 0)
  shoe.scale.set(3, 3, 3);
  shoe.receiveShadow = true; 
  scene.add(shoe);
  // Find laces and sole meshes by name
  const lacesMesh = shoe.getObjectByName("laces");
  const soleBottomMesh = shoe.getObjectByName("sole_bottom");

  shoeMeshes.push(lacesMesh, soleBottomMesh);

  lacesMesh.traverse(function(node){
    if (node.isMesh){
      node.castShadow = true;
  shoe.rotation.set(0, -65 * (Math.PI / 180), 0)
  shoe.traverse(function(node){
    if (node.isMesh){
      node.castShadow = true;
    }
  }) 
    }
  });
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

renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.antialias = true;

const texture = new THREE.TextureLoader().load('textures/normal2.png');
const material2 = new THREE.MeshStandardMaterial({ 
  map: texture,
  metalness: 0.5,
  roughness: 0.2,
 });

const oilBarrel = new OBJLoader();

oilBarrel.load(
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

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00  } );

//add orbit controls
//const controls = new OrbitControls(camera, renderer.domElement);

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

camera.position.y = 1;
camera.position.z = 1.5; //zoom in van 2 naar 1
camera.position.y = 0.65;
camera.lookAt(0, 0, 0);

let name = document.getElementById('name');
const paletteLaces = document.getElementById('color-palette-laces');
const paletteSole = document.getElementById('color-palette-sole');
const paletteLacesColors = paletteLaces.querySelectorAll('.box');
const paletteSoleColors = paletteSole.querySelectorAll('.box');
console.log(paletteLacesColors);

let colorLaces;
let colorSole;
let lacesRaycastClicked = false;
let soleRaycastClicked = false;

function handleColorBoxClick(color) {
  console.log(`Clicked color: ${color}`);

  lacesRaycastClicked = false;
  soleRaycastClicked = false;
}

// Attach click event listeners to each color box in the laces palette
paletteLacesColors.forEach((colorBox) => {
  colorBox.addEventListener('click', () => {
    colorLaces = colorBox.style.backgroundColor;
    handleColorBoxClick(colorLaces);
  });
});

// Attach click event listeners to each color box in the sole palette
paletteSoleColors.forEach((colorBox) => {
  colorBox.addEventListener('click', () => {
    colorSole = colorBox.style.backgroundColor;
    handleColorBoxClick(colorSole);
  });
});

const clock = new THREE.Clock();

// Function to change the color of the laces
function changeLacesColor(color) {
  if (shoe) {
    const lacesMesh = shoe.getObjectByName("laces");
    if (lacesMesh) {
      lacesMesh.material.color.set(color);
    }
  }
};

function changeSoleBottomColor(color) {
  if (shoe) {
    const soleBottomMesh = shoe.getObjectByName("sole_bottom");
    if (soleBottomMesh) {
      soleBottomMesh.material.color.set(color);
    }
  }
};

function handlePaletteClick() {
  // Check if laces are not already red
  if (!lacesRaycastClicked) {
    // Change the color of the laces
    changeLacesColor(colorLaces);
    lacesRaycastClicked = true;
  }
}

function handlePaletteSoleClick() {
  // Check if sole is not already red
  if (!soleRaycastClicked) {
    // Change the color of the sole
    changeSoleBottomColor(colorSole);
    soleRaycastClicked = true;
  }
}

// Handle click event
window.addEventListener('click', function () {
  const intersects = raycaster.intersectObjects(shoeMeshes, true);

  for (const intersect of intersects) {
    if (intersect.object.isMesh) {
      // Look at the clicked object
      camera.lookAt(intersect.object.position);

      // Set camera position based on the clicked object
      /*camera.position.z = 0;
      camera.position.x = 1; // Adjust as needed
      camera.position.y = 1; // Adjust as needed*/

      // Handle different parts of the shoe
      if (intersect.object.name === "laces") {
        name.innerHTML = "Laces";
        paletteLaces.style.display = "flex";
        paletteSole.style.display = "none";

        // Corrected the event listener to use paletteLaces
        paletteLaces.removeEventListener('click', handlePaletteSoleClick);
        paletteLaces.addEventListener('click', handlePaletteClick);
      } 
      if (intersect.object.name === "sole_bottom") {
        name.innerHTML = "Sole Bottom";
        paletteSole.style.display = "flex";
        paletteLaces.style.display = "none";

        // Corrected the event listener to use paletteSole
        paletteSole.removeEventListener('click', handlePaletteClick);
        paletteSole.addEventListener('click', handlePaletteSoleClick);
      }
    }
  }
});




function animate() {

  const elapsedTime = clock.getElapsedTime();
  const speed = elapsedTime * 0.1;

  planeMaterial.uniforms.time.value += 0.01;


  // Update raycaster position based on mouse movement
  raycaster.setFromCamera(pointer, camera);

  // Raycast to find intersected objects
  const intersects = raycaster.intersectObjects([...shoeMeshes, /* Add other objects to exclude if needed */], true);

  // Flag to track whether an intersected mesh has been found
  let meshFound = false;

 // Reset color for all objects
scene.traverse((node) => {
  if (node.isMesh && !lacesRaycastClicked && !soleRaycastClicked && node !== plane) {
    // Change the color only if both lacesRaycastClicked and soleRaycastClicked are false
    node.material.color.set("#ffffff");
  }  if (node.isMesh && lacesRaycastClicked && node.name !== "laces" && node !== plane) {
    // Check if laces are already red before changing the color to white
    if (node.material.color.getHexString() !== "ff0000") {
      node.material.color.set("#ffffff");
    }
  }  if (node.isMesh && soleRaycastClicked && node.name !== "sole_bottom" && node !== plane) {
    // Check if sole is already red before changing the color to white
    if (node.material.color.getHexString() !== "ff0000") {
      node.material.color.set("#ffffff");
    }
  }
});

  // Change color for the first intersected mesh
  for (const intersect of intersects) {
    if (intersect.object.isMesh && !meshFound && lacesRaycastClicked === false && soleRaycastClicked === false) {
      intersect.object.material.color.set("#69ff47");
      meshFound = true;
    }  if (intersect.object.isMesh && !meshFound && lacesRaycastClicked === true && intersect.object.name !== "laces"){
      intersect.object.material.color.set("#69ff47");
      meshFound = true;
    }  if (intersect.object.isMesh && !meshFound && soleRaycastClicked === true && intersect.object.name !== "sole_bottom"){
      intersect.object.material.color.set("#69ff47");
      meshFound = true;
      
    }
  }
   
  /*if (oilBarrel) {
    const oscillationAmplitude = 0.1; // Adjust the amplitude as needed
    const oscillationSpeed = 0.5; // Adjust the speed as needed
    const minY = -0.; // Minimum Y position
    const maxY = 0.5; // Maximum Y position

    oilBarrel.position.y = Math.sin(elapsedTime * oscillationSpeed) * oscillationAmplitude;
  }*/

  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

animate();
