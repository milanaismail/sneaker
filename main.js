import './style.css';
import * as THREE from 'three';
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
raycaster.precision = 0.1; 
raycaster.params.Points.threshold = 0.1; 

const pointer = new THREE.Vector2();

const audioLoader = new THREE.AudioLoader();

const listener = new THREE.AudioListener();

camera.add(listener);

//audio

const sound = new THREE.PositionalAudio(listener);
function loadAudio() {
  audioLoader.load("/sounds/Click.mp3", function(buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sound.setRefDistance(5); 
    scene.add(sound);

    playClickSound();

  });
}

function playClickSound() {
  sound.play();
}

//add audio when clicking
window.addEventListener('click', loadAudio);

const onPointerMove = ( event ) => {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
window.addEventListener( 'pointermove', onPointerMove );

//add gridhelper 
const size = 50;
const divisions = 50;
const gridHelper = new THREE.GridHelper( size, divisions );

scene.add( gridHelper );

gridHelper.position.y = -1;

//change color of gridhelper
gridHelper.material.color.set(0xffffff);
// change width of gridhelper
gridHelper.material.linewidth = 3;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
const canvas = document.querySelector('.canvas-container');
canvas.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.antialias = true;

renderer.setPixelRatio(window.devicePixelRatio);

      
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

document.addEventListener('mousemove', (event) => {
  if (isDragging && shoe) {
    const delta = event.clientX - previousMouseX;
    previousMouseX = event.clientX;

    // Rotate the shoe based on mouse movement
    shoe.rotation.y += delta * 0.01; 
  }
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

//Texture for barrel
const texture = new THREE.TextureLoader().load('textures/normal2.png');
const material2 = new THREE.MeshStandardMaterial({ 
  map: texture,
  metalness: 0.5,
  roughness: 0.2,
 });

//add oil barrel
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
//scene.add(helper);


//camera position
camera.position.y = 1;
camera.position.z = 1.1; 
camera.position.y = 0.65;
camera.lookAt(0, 0, 0);

  // Find laces and sole meshes by name
  const lacesMesh = shoe.getObjectByName("laces");
  const soleBottomMesh = shoe.getObjectByName("sole_bottom");
  const soleTopMesh = shoe.getObjectByName("sole_top");
  const insideMesh = shoe.getObjectByName("inside");
  const outside1Mesh = shoe.getObjectByName("outside_1");
  const outside2Mesh = shoe.getObjectByName("outside_2");
  const outside3Mesh = shoe.getObjectByName("outside_3");
  
  shoeMeshes.push(lacesMesh, soleBottomMesh, soleTopMesh, insideMesh, outside1Mesh, outside2Mesh, outside3Mesh);
  //console.log(lacesMesh);
  
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

  let hoveredPart = null;

// Function to handle color option clicks
function onColorOptionClick(event) {
  const selectedColor = new THREE.Color(parseInt(event.target.dataset.color, 16));
  
  // Update the color of the clicked part
  /*  if (selectedPart) {
  const newMaterial = new THREE.MeshStandardMaterial({
      color: selectedColor,
      metalness: 0.5,
      roughness: 0.2,
    }); USE FOR FABRICS*/

    // Replace the material of the selected part
    if (hoveredPart || selectedPart) {
      const targetPart = selectedPart || hoveredPart;
      targetPart.material.color.copy(selectedColor);
  
      // Store the selected color for the part
      partColors.set(targetPart.uuid, selectedColor);
    }
  }

// Add color option click event listeners
const colorOptions = document.querySelectorAll('.colorOption .box');
colorOptions.forEach(option => option.addEventListener('click', onColorOptionClick));

// Variable to store the selected part
let selectedPart = null;

const partColors = new Map();

// Function to handle the raycasting logic
function onDocumentMouseMove(event) {
  event.preventDefault();

  // Calculate mouse position in normalized device coordinates
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(pointer, camera);

  // Check for intersections with the shoe meshes
  const intersects = raycaster.intersectObjects(shoeMeshes, true);

// Reset color for all shoe parts except the clicked part
if (selectedPart) {
  shoeMeshes.forEach(mesh => {
    if (mesh !== selectedPart) {
      mesh.material.color.set(0xffffff); // Reset color
    }
  });
} else {
  // Reset color for all shoe parts
  shoeMeshes.forEach(mesh => {
    if (mesh !== hoveredPart) {
      mesh.material.color.set(0xffffff); // Reset color
    }
  });
}


  // Apply the hover effect to the currently hovered part
  if (intersects.length > 0) {
      hoveredPart = intersects[0].object;
      // Change the material color or apply a hover effect (customize based on your needs)
      hoveredPart.material.color.set(0x000000); // Hover color
  }
}

window.addEventListener('mousemove', onDocumentMouseMove, false);

function onDocumentMouseDown(event) {
  event.preventDefault();

  // Calculate mouse position in normalized device coordinates
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(pointer, camera);

  // Check for intersections with the shoe meshes
  const intersects = raycaster.intersectObjects(shoeMeshes, true);
// Reset color for all shoe parts
shoeMeshes.forEach(mesh => {
  mesh.material.color.set(0xffffff); // Reset color
});

// Apply the color to the clicked part
if (intersects.length > 0) {
  selectedPart = intersects[0].object;
  selectedPart.material.color.set(0x000000); // Set color to black

  // Store the selected part for later reference
  hoveredPart = selectedPart;

}
}

// Add the click event listener
window.addEventListener('click', onDocumentMouseDown, false);



// clock for animation
const clock = new THREE.Clock();


document.getElementById('size').addEventListener('change', function () {
  const button = document.getElementById('orderButton');
  button.disabled = this.value === ''; // Disable the button if no size is selected
});

function animate() {
  const elapsedTime = clock.getElapsedTime();
  const speed = elapsedTime * 0.1;

  // change plane gradients
  planeMaterial.uniforms.time.value += 0.01;

  

  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

animate();
