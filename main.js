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
  
  // Find laces and sole meshes by name
  const lacesMesh = shoe.getObjectByName("laces");
  const soleBottomMesh = shoe.getObjectByName("sole_bottom");
  const soleTopMesh = shoe.getObjectByName("sole_top");
  const insideMesh = shoe.getObjectByName("inside");
  const outside1Mesh = shoe.getObjectByName("outside_1");
  const outside2Mesh = shoe.getObjectByName("outside_2");
  const outside3Mesh = shoe.getObjectByName("outside_3");

  shoeMeshes.push(lacesMesh, soleBottomMesh, soleTopMesh, insideMesh, outside1Mesh, outside2Mesh, outside3Mesh);
  console.log(lacesMesh.material.map);

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
    shoe.rotation.y += delta * 0.01; 
  }
});

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
const canvas = document.querySelector('.canvas-container');
canvas.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.antialias = true;

renderer.setPixelRatio(window.devicePixelRatio);

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
camera.position.z = 1.5; 
camera.position.y = 0.65;
camera.lookAt(0, 0, 0);

let name = document.getElementById('name');
const container = document.querySelector('.color-palette-container');
const paletteLaces = document.getElementById('color-palette-laces');
const fabricLaces = document.getElementById('color-fabrics-laces');
const paletteSole = document.getElementById('color-palette-sole');
const paletteSoleTop = document.getElementById('color-palette-sole-top');
const paletteOutside1 = document.getElementById('color-palette-outside1');
const paletteOutside2 = document.getElementById('color-palette-outside2');
const paletteOutside3 = document.getElementById('color-palette-outside3');
const paletteInside = document.getElementById('color-palette-inside');
const paletteLacesColors = paletteLaces.querySelectorAll('.box');
const fabricLaceMat = fabricLaces.querySelectorAll('.box');
const paletteSoleColors = paletteSole.querySelectorAll('.box');
const paletteSoleTopColors = paletteSoleTop.querySelectorAll('.box');
const paletteOutside1Colors = paletteOutside1.querySelectorAll('.box');
const paletteOutside2Colors = paletteOutside2.querySelectorAll('.box');
const paletteOutside3Colors = paletteOutside3.querySelectorAll('.box');
const paletteInsideColors = paletteInside.querySelectorAll('.box');

let colorLaces;
let colorSole;
let colorSoleTop;
let colorOutside1;
let colorOutside2;
let colorOutside3;
let colorInside;
let fabricLace;
let lacesRaycastClicked = false;
let soleRaycastClicked = false;
let soleTopRaycastClicked = false;
let outside1RaycastClicked = false;
let outside2RaycastClicked = false;
let outside3RaycastClicked = false;
let insideRaycastClicked = false;

function handleColorBoxClick(color) {
  console.log(`Clicked color: ${color}`);
  lacesRaycastClicked = false;
  soleRaycastClicked = false;
  soleTopRaycastClicked = false;
  outside1RaycastClicked = false;
  outside2RaycastClicked = false;
  outside3RaycastClicked = false;
  insideRaycastClicked = false;
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

// Attach click event listeners to each color box in the sole top palette
paletteSoleTopColors.forEach((colorBox) => {
  colorBox.addEventListener('click', () => {
    colorSoleTop = colorBox.style.backgroundColor;
    handleColorBoxClick(colorSoleTop);
  });
});

// Attach click event listeners to each color box in the outside 1 palette
paletteOutside1Colors.forEach((colorBox) => {
  colorBox.addEventListener('click', () => {
    colorOutside1 = colorBox.style.backgroundColor;
    handleColorBoxClick(colorOutside1);
  });
});

// Attach click event listeners to each color box in the outside 2 palette
paletteOutside2Colors.forEach((colorBox) => {
  colorBox.addEventListener('click', () => {
    colorOutside2 = colorBox.style.backgroundColor;
    handleColorBoxClick(colorOutside2);
  });
});

// Attach click event listeners to each color box in the outside 3 palette
paletteOutside3Colors.forEach((colorBox) => {
  colorBox.addEventListener('click', () => {
    colorOutside3 = colorBox.style.backgroundColor;
    handleColorBoxClick(colorOutside3);
  });
});

// Attach click event listeners to each color box in the inside palette
paletteInsideColors.forEach((colorBox) => {
  colorBox.addEventListener('click', () => {
    colorInside = colorBox.style.backgroundColor;
    handleColorBoxClick(colorInside);
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

/*function changeLacesFabric(fabric) {
  if (shoe) {
    const lacesMesh = shoe.getObjectByName("laces");
    if (lacesMesh) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        fabric,
        (newTexture) => {
          console.log("Texture loaded successfully:", newTexture);
          lacesMesh.material.map = newTexture;
          lacesMesh.material.needsUpdate = true;
          lacesMesh.material.map.needsUpdate = true;
    console.log(shoeMeshes[0].material.map);

        },
        undefined,
        (error) => {
          console.error("Error loading texture:", error);
        }
      );
    }
  }
}*/


  
function changeSoleBottomColor(color) {
  if (shoe) {
    const soleBottomMesh = shoe.getObjectByName("sole_bottom");
    if (soleBottomMesh) {
      soleBottomMesh.material.color.set(color);
    }
  }
};

function changeSoleTopColor(color) {
  if (shoe) {
    const soleTopMesh = shoe.getObjectByName("sole_top");
    if (soleTopMesh) {
      soleTopMesh.material.color.set(color);
    }
  }
};

function changeOutside1Color(color) {
  if (shoe) {
    const outside1Mesh = shoe.getObjectByName("outside_1");
    if (outside1Mesh) {
      outside1Mesh.material.color.set(color);
    }
  }
};

function changeOutside2Color(color) {
  if (shoe) {
    const outside2Mesh = shoe.getObjectByName("outside_2");
    if (outside2Mesh) {
      outside2Mesh.material.color.set(color);
    }
  }
};

function changeOutside3Color(color) {
  if (shoe) {
    const outside3Mesh = shoe.getObjectByName("outside_3");
    if (outside3Mesh) {
      outside3Mesh.material.color.set(color);
    }
  }
};

function changeInsideColor(color) {
  if (shoe) {
    const insideMesh = shoe.getObjectByName("inside");
    if (insideMesh) {
      insideMesh.material.color.set(color);
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

function handleFabricClick() {
    if (!lacesRaycastClicked) {
      // Change the fabric of the laces
      changeLacesFabric(fabricLace);
      lacesRaycastClicked = true;
    console.log("The laces are:" + fabricLace);
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

function handlePaletteSoleTopClick() {
  // Check if sole is not already red
  if (!soleTopRaycastClicked) {
    // Change the color of the sole
    changeSoleTopColor(colorSoleTop);
    soleTopRaycastClicked = true;
  }
}

function handlePaletteOutside1Click() {
  // Check if sole is not already red
  if (!outside1RaycastClicked) {
    // Change the color of the sole
    changeOutside1Color(colorOutside1);
    outside1RaycastClicked = true;
  }
}

function handlePaletteOutside2Click() {
  // Check if sole is not already red
  if (!outside2RaycastClicked) {
    // Change the color of the sole
    changeOutside2Color(colorOutside2);
    outside2RaycastClicked = true;
  }
}

function handlePaletteOutside3Click() {
  // Check if sole is not already red
  if (!outside3RaycastClicked) {
    // Change the color of the sole
    changeOutside3Color(colorOutside3);
    outside3RaycastClicked = true;
  }
}

function handlePaletteInsideClick() {
  // Check if sole is not already red
  if (!insideRaycastClicked) {
    // Change the color of the sole
    changeInsideColor(colorInside);
    insideRaycastClicked = true;
  }
}

// Handle click event
window.addEventListener('click', function () {
  const intersects = raycaster.intersectObjects(shoeMeshes, true);

  for (const intersect of intersects) {
    if (intersect.object.isMesh) {
      // Look at the clicked object
      camera.lookAt(intersect.object.position);

      // Handle different parts of the shoe
      if (intersect.object.name === "laces") {
        name.innerHTML = "Laces";
        container.style.display = "block";
        paletteLaces.style.display = "flex";
        fabricLaces.style.display = "flex";
        paletteSole.style.display = "none";
        paletteSoleTop.style.display = "none";
        paletteInside.style.display = "none";
        paletteOutside1.style.display = "none";
        paletteOutside2.style.display = "none";
        paletteOutside3.style.display = "none";

        // Corrected the event listener to use paletteLaces
        paletteLaces.removeEventListener('click', handlePaletteSoleClick);
        paletteLaces.addEventListener('click', handlePaletteClick);
        fabricLaces.removeEventListener('click', handlePaletteSoleClick);
        paletteLaces.removeEventListener('click', handlePaletteSoleTopClick);
        paletteLaces.removeEventListener('click', handlePaletteOutside1Click);
        paletteLaces.removeEventListener('click', handlePaletteOutside2Click);
        paletteLaces.removeEventListener('click', handlePaletteOutside3Click);
        paletteLaces.removeEventListener('click', handlePaletteInsideClick);
        //fabricLaces.addEventListener('click', handleFabricClick);
      } 
      if (intersect.object.name === "sole_bottom") {
        name.innerHTML = "Sole Bottom";
        paletteSole.style.display = "flex";
        container.style.display = "none";
        fabricLaces.style.display = "none";
        paletteLaces.style.display = "none";
        paletteSoleTop.style.display = "none";
        paletteInside.style.display = "none";
        paletteOutside1.style.display = "none";
        paletteOutside2.style.display = "none";
        paletteOutside3.style.display = "none";

        // Corrected the event listener to use paletteSole
        paletteSole.removeEventListener('click', handlePaletteClick);
        paletteSole.addEventListener('click', handlePaletteSoleClick);
        paletteSole.removeEventListener('click', handlePaletteSoleTopClick);
        paletteSole.removeEventListener('click', handlePaletteOutside1Click);
        paletteSole.removeEventListener('click', handlePaletteOutside2Click);
        paletteSole.removeEventListener('click', handlePaletteOutside3Click);
        paletteSole.removeEventListener('click', handlePaletteInsideClick);
      }
      if (intersect.object.name === "sole_top") {
        name.innerHTML = "Sole Top";
        container.style.display = "none";
        paletteSole.style.display = "none";
        fabricLaces.style.display = "none";
        paletteLaces.style.display = "none";
        paletteSoleTop.style.display = "flex";
        paletteInside.style.display = "none";
        paletteOutside1.style.display = "none";
        paletteOutside2.style.display = "none";
        paletteOutside3.style.display = "none";

        // Corrected the event listener to use paletteSoleTop
        paletteSoleTop.removeEventListener('click', handlePaletteClick);
        paletteSoleTop.removeEventListener('click', handlePaletteSoleClick);
        paletteSoleTop.addEventListener('click', handlePaletteSoleTopClick);
        paletteSoleTop.removeEventListener('click', handlePaletteOutside1Click);
        paletteSoleTop.removeEventListener('click', handlePaletteOutside2Click);
        paletteSoleTop.removeEventListener('click', handlePaletteOutside3Click);
        paletteSoleTop.removeEventListener('click', handlePaletteInsideClick);
      }
      if (intersect.object.name === "outside_1") {
        name.innerHTML = "Outside 1";
        container.style.display = "none";
        paletteSole.style.display = "none";
        fabricLaces.style.display = "none";
        paletteLaces.style.display = "none";
        paletteSoleTop.style.display = "none";
        paletteInside.style.display = "none";
        paletteOutside1.style.display = "flex";
        paletteOutside2.style.display = "none";
        paletteOutside3.style.display = "none";

        // Corrected the event listener to use paletteOutside1
        paletteOutside1.removeEventListener('click', handlePaletteClick);
        paletteOutside1.removeEventListener('click', handlePaletteSoleClick);
        paletteOutside1.removeEventListener('click', handlePaletteSoleTopClick);
        paletteOutside1.addEventListener('click', handlePaletteOutside1Click);
        paletteOutside1.removeEventListener('click', handlePaletteOutside2Click);
        paletteOutside1.removeEventListener('click', handlePaletteOutside3Click);
        paletteOutside1.removeEventListener('click', handlePaletteInsideClick);
      }
      if (intersect.object.name === "outside_2") {
        name.innerHTML = "Outside 2";
        container.style.display = "none";
        paletteSole.style.display = "none";
        fabricLaces.style.display = "none";
        paletteLaces.style.display = "none";
        paletteSoleTop.style.display = "none";
        paletteInside.style.display = "none";
        paletteOutside1.style.display = "none";
        paletteOutside2.style.display = "flex";
        paletteOutside3.style.display = "none";

        // Corrected the event listener to use paletteOutside2
        paletteOutside2.removeEventListener('click', handlePaletteClick);
        paletteOutside2.removeEventListener('click', handlePaletteSoleClick);
        paletteOutside2.removeEventListener('click', handlePaletteSoleTopClick);
        paletteOutside2.removeEventListener('click', handlePaletteOutside1Click);
        paletteOutside2.addEventListener('click', handlePaletteOutside2Click);
        paletteOutside2.removeEventListener('click', handlePaletteOutside3Click);
        paletteOutside2.removeEventListener('click', handlePaletteInsideClick);
      }
      if (intersect.object.name === "outside_3") {
        name.innerHTML = "Outside 3";
        container.style.display = "none";
        paletteSole.style.display = "none";
        fabricLaces.style.display = "none";
        paletteLaces.style.display = "none";
        paletteSoleTop.style.display = "none";
        paletteInside.style.display = "none";
        paletteOutside1.style.display = "none";
        paletteOutside2.style.display = "none";
        paletteOutside3.style.display = "flex";

        // Corrected the event listener to use paletteOutside3
        paletteOutside3.removeEventListener('click', handlePaletteClick);
        paletteOutside3.removeEventListener('click', handlePaletteSoleClick);
        paletteOutside3.removeEventListener('click', handlePaletteSoleTopClick);
        paletteOutside3.removeEventListener('click', handlePaletteOutside1Click);
        paletteOutside3.removeEventListener('click', handlePaletteOutside2Click);
        paletteOutside3.addEventListener('click', handlePaletteOutside3Click);
        paletteOutside3.removeEventListener('click', handlePaletteInsideClick);
      }
      if (intersect.object.name === "inside") {
        name.innerHTML = "Inside";
        container.style.display = "none";
        paletteSole.style.display = "none";
        fabricLaces.style.display = "none";
        paletteLaces.style.display = "none";
        paletteSoleTop.style.display = "none";
        paletteInside.style.display = "flex";
        paletteOutside1.style.display = "none";
        paletteOutside2.style.display = "none";
        paletteOutside3.style.display = "none";

        // Corrected the event listener to use paletteInside
        paletteInside.removeEventListener('click', handlePaletteClick);
        paletteInside.removeEventListener('click', handlePaletteSoleClick);
        paletteInside.removeEventListener('click', handlePaletteSoleTopClick);
        paletteInside.removeEventListener('click', handlePaletteOutside1Click);
        paletteInside.removeEventListener('click', handlePaletteOutside2Click);
        paletteInside.removeEventListener('click', handlePaletteOutside3Click);
        paletteInside.addEventListener('click', handlePaletteInsideClick);
      }
    }
  }
});

// Function to handle color box click
function colorBoxClicked(colorBox) {
  console.log(`Clicked color: ${colorBox.style.backgroundColor}`);
  lacesRaycastClicked = false;
  soleRaycastClicked = false;

  // Remove the 'selected' class from all color boxes
  paletteLacesColors.forEach(box => box.classList.remove('selected'));
  fabricLaceMat.forEach(box => box.classList.remove('selected'));
  paletteSoleColors.forEach(box => box.classList.remove('selected'));

  // Add the 'selected' class to the clicked color box
  colorBox.classList.add('selected');
}

// Attach click event listeners to each color box in the laces palette
paletteLacesColors.forEach((colorBox) => {
  colorBox.addEventListener('click', () => {
    colorLaces = colorBox.style.backgroundColor;
    colorBoxClicked(colorBox);
  });
});

// Attach click event listeners to each color box in the sole palette
paletteSoleColors.forEach((colorBox) => {
  colorBox.addEventListener('click', () => {
    colorSole = colorBox.style.backgroundColor;
    colorBoxClicked(colorBox);
  });
});

document.getElementById('size').addEventListener('change', function () {
  const button = document.getElementById('orderButton');
  button.disabled = this.value === ''; // Disable the button if no size is selected
});

function animate() {
  const elapsedTime = clock.getElapsedTime();
  const speed = elapsedTime * 0.1;

  // change plane gradients
  planeMaterial.uniforms.time.value += 0.01;


  // Update raycaster position based on mouse movement
  raycaster.setFromCamera(pointer, camera);

  // Raycast to find intersected objects
  const intersects = raycaster.intersectObjects([...shoeMeshes, /* Add other objects to exclude if needed */], true);

  // Flag to track whether an intersected mesh has been found
  let meshFound = false;

 // Reset color for all objects
scene.traverse((node) => {
  if (node.isMesh && !lacesRaycastClicked && !soleRaycastClicked && !soleTopRaycastClicked && !outside1RaycastClicked && !outside2RaycastClicked && !outside3RaycastClicked && !insideRaycastClicked && node !== plane) {
    // Change the color only if both lacesRaycastClicked and soleRaycastClicked are false
    node.material.color.set("#ffffff");
  }  if (node.isMesh && lacesRaycastClicked && node.name !== "laces" && node !== plane) {
    // Check if laces are already red before changing the color to white
    if (node.material.color.getHexString() === "69ff47") {
      node.material.color.set("#ffffff");
    }
  }  if (node.isMesh && soleRaycastClicked && node.name !== "sole_bottom" && node !== plane) {
    // Check if sole is already red before changing the color to white
    if (node.material.color.getHexString() === "69ff47") {
      node.material.color.set("#ffffff");
    }
  } if (node.isMesh && soleTopRaycastClicked && node.name !== "sole_top" && node !== plane) {
    // Check if sole is already red before changing the color to white
    if (node.material.color.getHexString() === "69ff47") {
      node.material.color.set("#ffffff");
    }
  } if (node.isMesh && outside1RaycastClicked && node.name !== "outside_1" && node !== plane) {
    // Check if sole is already red before changing the color to white
    if (node.material.color.getHexString() === "69ff47") {
      node.material.color.set("#ffffff");
    }
  } if (node.isMesh && outside2RaycastClicked && node.name !== "outside_2" && node !== plane) {
    // Check if sole is already red before changing the color to white
    if (node.material.color.getHexString() === "69ff47") {
      node.material.color.set("#ffffff");
    }
  } if (node.isMesh && outside3RaycastClicked && node.name !== "outside_3" && node !== plane) {
    // Check if sole is already red before changing the color to white
    if (node.material.color.getHexString() === "69ff47") {
      node.material.color.set("#ffffff");
    }
  } if (node.isMesh && insideRaycastClicked && node.name !== "inside" && node !== plane) {
    // Check if sole is already red before changing the color to white
    if (node.material.color.getHexString() === "69ff47") {
      node.material.color.set("#ffffff");
    }
  } 
});

  // Change color for the first intersected mesh
  for (const intersect of intersects) {

    //change color to green if intersected object is white
    if (intersect.object.isMesh && !meshFound && intersect.object.material.color.getHexString() === "ffffff" && lacesRaycastClicked === false && soleRaycastClicked === false  && soleTopRaycastClicked === false 
    && outside1RaycastClicked === false && outside2RaycastClicked === false && outside3RaycastClicked === false && insideRaycastClicked === false && intersect) {
      intersect.object.material.color.set("#69ff47");
      meshFound = true;
    } if (intersect.object.isMesh && !meshFound && intersect.object.material.color.getHexString() === "ffffff" && lacesRaycastClicked === true && intersect.object.name !== "laces"){
      intersect.object.material.color.set("#69ff47");
      meshFound = true;
    }  if (intersect.object.isMesh && !meshFound && intersect.object.material.color.getHexString() === "ffffff" && soleRaycastClicked === true && intersect.object.name !== "sole_bottom"){
      intersect.object.material.color.set("#69ff47");
      meshFound = true; 
    } if (intersect.object.isMesh && !meshFound && intersect.object.material.color.getHexString() === "ffffff" && soleTopRaycastClicked === true && intersect.object.name !== "sole_top"){
      intersect.object.material.color.set("#69ff47");
      meshFound = true; 
    } if (intersect.object.isMesh && !meshFound && intersect.object.material.color.getHexString() === "ffffff" && outside1RaycastClicked === true && intersect.object.name !== "outside_1"){
      intersect.object.material.color.set("#69ff47");
      meshFound = true; 
    } if (intersect.object.isMesh && !meshFound && intersect.object.material.color.getHexString() === "ffffff" && outside2RaycastClicked === true && intersect.object.name !== "outside_2"){
      intersect.object.material.color.set("#69ff47");
      meshFound = true; 
    } if (intersect.object.isMesh && !meshFound && intersect.object.material.color.getHexString() === "ffffff" && outside3RaycastClicked === true && intersect.object.name !== "outside_3"){
      intersect.object.material.color.set("#69ff47");
      meshFound = true; 
    } if (intersect.object.isMesh && !meshFound && intersect.object.material.color.getHexString() === "ffffff" && insideRaycastClicked === true && intersect.object.name !== "inside"){
      intersect.object.material.color.set("#69ff47");
      meshFound = true; 
    }
  }
  
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

animate();
