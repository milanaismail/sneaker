import './style.css';
import * as THREE from 'three';
//import gftloader
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
//import draco loader
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

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
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
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

//add orbit controls
/*const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();*/


//add public/cubemap
const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMapTexture = cubeTextureLoader.load([
  '/public/cubemap/px.png',
  '/public/cubemap/nx.png',
  '/public/cubemap/py.png',
  '/public/cubemap/ny.png',
  '/public/cubemap/pz.png',
  '/public/cubemap/nz.png',
]);


scene.background = environmentMapTexture;

      
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
/*const texture = new THREE.TextureLoader().load('textures/normal2.png');
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
	});*/

//add cylinder
const cylinderGeometry = new THREE.CylinderGeometry( 1.3, 1.3, 0.2, 80 );
const cylinderMaterial = new THREE.MeshStandardMaterial( 
  { color: "#d357fe",
    emissive: "#ffa57d",
    emissiveIntensity: 0.2,
    metalness: 0.4,
    roughness: 0.1,
    envMap: environmentMapTexture,
  } );
const cylinder = new THREE.Mesh( cylinderGeometry, cylinderMaterial );
scene.add( cylinder );
//receive shadow cylinder
cylinder.receiveShadow = true;
cylinder.castShadow = true;
cylinder.position.set(0, -0.3, -0.7);


//add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff,1.9);
scene.add(ambientLight);

//add spotlight
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 2, 0);
spotLight.target.position.set(0, -0.5, 0);


//add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
directionalLight.position.set(0, 10, 1);
directionalLight.target.position.set(0, -0.5, 0);

//add directional helper
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(directionalLightHelper);

//add shadow
directionalLight.castShadow = true;
scene.add(directionalLight);

//add helper
const helper = new THREE.DirectionalLightHelper(directionalLight, 5); 
//scene.add(helper);


//camera position
camera.position.y = 0.65;
camera.position.z = 1.1; 
camera.lookAt(0, 0, 0);
console.log('Camera Position:', camera.position.x, camera.position.y, camera.position.z);
//add orbit controls

/*let initials = "VZ";

document.getElementById('initialButton').addEventListener('click', function() {
  initials = document.getElementById('initials').value;
  scene.remove(scene.getObjectByName('text'));
  createTextMesh();
  console.log(initials);
});
let fontMesh;
function createTextMesh (){
const fontLoader = new FontLoader();

fontLoader.load( 'fonts/Mulish_Regular.json', function ( font ) {
  console.log(font);
	const fontGeometry = new TextGeometry( initials, {
		font: font,
		size: 0.05,
		height: 0.01,
		curveSegments: 12,
		bevelThickness: 0.010,
		bevelSize: 0.08,
		bevelOffset: 0,
		bevelSegments: 5,
	} );
  const fontMaterial = new THREE.MeshBasicMaterial([
    new THREE.MeshPhongMaterial({
       color: 0xff22cc,
       flatShading: true,
    }), // front
    new THREE.MeshPhongMaterial({
       color: 0xffcc22
    }), // side
  ])
  const fontMesh = new THREE.Mesh(fontGeometry, fontMaterial)
  fontMesh.name = 'text'
  scene.add(fontMesh)
  fontMesh.position.set(0.45, 0.25, -0.5);
  fontMesh.rotation.set(0, -65 * (Math.PI / 45), 0);

  } );

};*/

/*const fontLoader = new FontLoader();
const font = fontLoader.load(
	// resource URL
	'fonts/Mulish_Regular.json',

	// onLoad callback
	function ( font ) {
		// do something with the font
		console.log( font );
	},

	// onProgress callback
	function ( xhr ) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},

	// onError callback
	function ( err ) {
		console.log( 'An error happened' );
	}
);*/


let customizationData = {
  lacesColor: null,
  soleBottomColor: null,
  soleTopColor: null,
  liningColor: null,
  frontPartColor: null,
  upperPartColor: null,
  bodyColor: null,
  fabricLacesType: null,
  fabricSoleBottomType: null,
  fabricSoleTopType: null,
  fabricLiningType: null,
  fabricFrontPartType: null,
  fabricUpperPartType: null,
  fabricBodyType: null,
  shoeSize: null,
};

function sendAllCustomizationData() {
  // Basic fetch function to send customization data to the server
  fetch('/api/saveAllCustomization', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customizationData),
  })
  .then(response => response.json())
  .then(data => {
    console.log('All customization data sent to the backend:', data);
    // Reset customizationData after successful submission
    customizationData = {
      lacesColor: null,
      soleBottomColor: null,
      soleTopColor: null,
      liningColor: null,
      frontPartColor: null,
      upperPartColor: null,
      bodyColor: null,
      fabricLacesType: null,
      fabricSoleBottomType: null,
      fabricSoleTopType: null,
      fabricLiningType: null,
      fabricFrontPartType: null,
      fabricUpperPartType: null,
      fabricBodyType: null,
      shoeSize: null,
    };
  })
  .catch(error => {
    console.error('Error sending customization data:', error);
  });
}


let shoe;

const shoeMeshes = [];

//add public/Shoe_compressed.glb 
loader.load('public/Shoe_compressed.glb', function(gltf){
  shoe = gltf.scene;
  shoe.position.set(0.05, 0.10, -0.04)
  shoe.rotation.set(0, -65 * (Math.PI / 180), 0)
  shoe.scale.set(3, 3, 3);
  shoe.receiveShadow = true; 
  

  const leatherTexture = new THREE.TextureLoader().load('/fabrics/leather.jpg');
  const leatherNormal = new THREE.TextureLoader().load('/fabrics/leatherNorm.jpg');
  const leatherReflect = new THREE.TextureLoader().load('/fabrics/leatherReflect.jpg');
  const leatherGloss = new THREE.TextureLoader().load('/fabrics/leatherGloss.jpg');
  leatherTexture.wrapS = THREE.RepeatWrapping;
  leatherTexture.wrapT = THREE.RepeatWrapping;
  leatherTexture.repeat.set(3, 3);
  
  const shoeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Set your desired color here
    normalMap: leatherNormal,
    displacementMap: leatherTexture,
    displacementScale: 0.1,
    envMap: leatherReflect,
    roughnessMap: leatherGloss,

  });
  
  scene.add(shoe);

  // Find laces and sole meshes by name
  const lacesMesh = shoe.getObjectByName("laces");
  const soleBottomMesh = shoe.getObjectByName("sole_bottom");
  const soleTopMesh = shoe.getObjectByName("sole_top");
  const insideMesh = shoe.getObjectByName("inside");
  const outside1Mesh = shoe.getObjectByName("outside_1");
  const outside2Mesh = shoe.getObjectByName("outside_2");
  const outside3Mesh = shoe.getObjectByName("outside_3");

  lacesMesh.name = "Laces";
  soleBottomMesh.name = "Sole bottom";
  soleTopMesh.name = "sole top";
  insideMesh.name = "Lining";
  outside1Mesh.name = "Front part";
  outside2Mesh.name = "Upper part";
  outside3Mesh.name = "Body";

  
  shoeMeshes.push(lacesMesh, soleBottomMesh, soleTopMesh, insideMesh, outside1Mesh, outside2Mesh, outside3Mesh);
  //console.log(lacesMesh);

  document.addEventListener('mousemove', (event) => {
    if (isDragging && shoe) {
      const delta = event.clientX - previousMouseX;
      previousMouseX = event.clientX;
  
      // Rotate the shoe based on mouse movement
      shoe.rotation.y += delta * 0.01; 
      

    }
  });
  

  shoe.traverse(function (node) {
    if (node.isMesh) {
      node.material = shoeMaterial.clone();
      node.castShadow = true;

      // Check if the mesh is part of the shoe
      if (shoeMeshes.includes(node)) {
        // Skip resetting color for the selected or hovered part
        if (node !== hoveredPart && node !== selectedPart) {
          node.material.color.set(0xffffff); // Reset color
        }
      }
    }
  });
});

let hoveredPart = null;
let selectedPart = null;
const partColors = new Map();


// Add color option click event listeners
const colorOptions = document.querySelectorAll('.colorOption .box');
colorOptions.forEach(option => option.addEventListener('click', onColorOptionClick));

const fabricOptions = document.querySelectorAll('.fabric-container .box-fabric');
fabricOptions.forEach(option => option.addEventListener('click', onFabricOptionsClick));

// Function to handle color option clicks
function onColorOptionClick(event) {
  const selectedColor = new THREE.Color(parseInt(event.target.dataset.color, 16));
    // Apply the selected color to the entire shoe
    if (selectedPart) {
      
      switch (selectedPart.name) {
        case 'Laces':
          
          customizationData.lacesColor = selectedColor;
          break;
        case 'Sole bottom':
          customizationData.soleBottomColor = selectedColor;
          break;
        case 'sole top':
          customizationData.soleTopColor = selectedColor;
          break;
        case 'Lining':
          customizationData.liningColor = selectedColor;
          break;
        case 'Front part':
          customizationData.frontPartColor = selectedColor;
          break;
        case 'Upper part':
          customizationData.upperPartColor = selectedColor;
          break;
        case 'Body':
          customizationData.bodyColor = selectedColor;
          break;

        // Add cases for other parts as needed
      } 
      if (selectedPart.material) {
        selectedPart.material.color.copy(selectedColor);
        partColors.set(selectedPart.uuid, selectedColor);

      }
  
  
      // Add or remove the 'selected' class based on the selected color
      const selectedBox = document.querySelector('.box.selected');
      if (selectedBox) {
        selectedBox.classList.remove('selected');
      }
      event.target.classList.add('selected');
    }
  }

  function onFabricOptionsClick(event) {
    const fabricType = event.currentTarget.id; // Get fabric type from parent container id
    console.log('Fabric type:', fabricType);

    if (selectedPart) {
      switch (selectedPart.name) {
        case 'Laces':
          
          customizationData.fabricLacesType = fabricType;
          break;
        case 'Sole bottom':
          customizationData.fabricSoleBottomType = fabricType;
          break;
        case 'sole top':
          customizationData.fabricSoleTopType = fabricType;
          break;
        case 'Lining':
          customizationData.fabricLiningType = fabricType;
          break;
        case 'Front part':
          customizationData.fabricFrontPartType = fabricType;
          break;
        case 'Upper part':
          customizationData.fabricUpperPartType = fabricType;
          break;
        case 'Body':
          customizationData.fabricBodyType = fabricType;
          break;
      }
    
    applyFabricToSelectedPart(fabricType);
  
    // Add or remove the 'selected' class based on the selected fabric
    const selectedFabric = document.querySelector('.box-fabric.selected');
    if (selectedFabric) {
      selectedFabric.classList.remove('selected');
    }
    event.target.classList.add('selected');
  }
}

function applyFabricToSelectedPart(fabricType) {
  console.log('Applying fabric to selected part. Fabric type:', fabricType);

  if (selectedPart) {
    const fabricMaterial = getFabricMaterial(fabricType);
    selectedPart.material = fabricMaterial;
    console.log('Applied fabric:', fabricType);
  }
}

  
function getFabricMaterial(fabricType) {
  switch (fabricType) {
    case 'leatherFabric':
      const leatherTexture = new THREE.TextureLoader().load('/fabrics/leather.jpg');
      const leatherNormal = new THREE.TextureLoader().load('/fabrics/leatherNorm.jpg');
      const leatherReflect = new THREE.TextureLoader().load('/fabrics/leatherReflect.jpg');
      const leatherGloss = new THREE.TextureLoader().load('/fabrics/leatherGloss.jpg');
      leatherTexture.wrapS = THREE.RepeatWrapping;
      leatherTexture.wrapT = THREE.RepeatWrapping;
      leatherTexture.repeat.set(3, 3);
      return new THREE.MeshStandardMaterial({
        color: selectedPart.material.color,
        normalMap: leatherNormal,
        displacementMap: leatherTexture,
        displacementScale: 0.1,
        envMap: leatherReflect,
        roughnessMap: leatherGloss,
      });
    case 'denimFabric':
      console.log('fabricType:', fabricType);
      // Load denim texture using TextureLoader
      const denimTexture = new THREE.TextureLoader().load('/fabrics/denim.jpg');
      const denimNormal = new THREE.TextureLoader().load('/fabrics/denimNorm.jpg');
      const denimOcc = new THREE.TextureLoader().load('/fabrics/denimOcc.jpg');
      const denimSpec = new THREE.TextureLoader().load('/fabrics/denimSpec.jpg');
      denimTexture.wrapS = THREE.RepeatWrapping;
      denimTexture.wrapT = THREE.RepeatWrapping;
      denimTexture.repeat.set(1, 1);
      return new THREE.MeshStandardMaterial({
        color: selectedPart.material.color,
        normalMap: denimNormal,
        displacementMap: denimTexture,
        displacementScale: 0.01,
        aoMap: denimOcc,
        aoMapIntensity: 0.5,
        //roughness: 0.5,
      });
    case 'metalLeatherFabric':
      const metalleatherTexture = new THREE.TextureLoader().load('/fabrics/leather.jpg');
      const metalleatherNormal = new THREE.TextureLoader().load('/fabrics/leatherNorm.jpg');
      const metalleatherReflect = new THREE.TextureLoader().load('/fabrics/leatherReflect.jpg');
      const metalleatherGloss = new THREE.TextureLoader().load('/fabrics/leatherGloss.jpg');
      metalleatherTexture.wrapS = THREE.RepeatWrapping;
      metalleatherTexture.wrapT = THREE.RepeatWrapping;
      metalleatherTexture.repeat.set(3, 3);
      return new THREE.MeshStandardMaterial({
        color: selectedPart.material.color,
        normalMap: metalleatherNormal,
        displacementMap: metalleatherTexture,
        displacementScale: 0.1,
        envMap: metalleatherReflect,
        roughnessMap: metalleatherGloss,
        metalness: 0.5,
      });
      case 'velvetFabric':
        const velvetTexture = new THREE.TextureLoader().load('/fabrics/velvet.png');
        const velvetNormal = new THREE.TextureLoader().load('/fabrics/velvetNorm.png');
        const velvetMetal = new THREE.TextureLoader().load('/fabrics/velvetMetal.png');
        const velvetRough = new THREE.TextureLoader().load('/fabrics/velvetRough.png');
        velvetTexture.wrapS = THREE.RepeatWrapping;
        velvetTexture.wrapT = THREE.RepeatWrapping;
        velvetTexture.repeat.set(3, 3);
        return new THREE.MeshStandardMaterial({
          color: selectedPart.material.color,
          normalMap: velvetNormal,
          displacementMap: velvetTexture,
          displacementScale: 0.1,
          metalnessMap: velvetMetal,
          //roughnessMap: velvetRough,
        });
        case 'polyesterFabric':
          const polyesterTexture = new THREE.TextureLoader().load('/fabrics/polyester.png');
          const polyesterNormal = new THREE.TextureLoader().load('/fabrics/polyesterNorm.png');
          polyesterTexture.wrapS = THREE.RepeatWrapping;
          polyesterTexture.wrapT = THREE.RepeatWrapping;
          polyesterTexture.repeat.set(3, 3);
          return new THREE.MeshStandardMaterial({
            color: selectedPart.material.color,
            normalMap: polyesterNormal,
            displacementMap: polyesterTexture,
            displacementScale: 0.1,
            //roughnessMap: velvetRough,
          });
    default:
      // Default material if fabricType is not recognized
      return new THREE.MeshStandardMaterial({
        color: selectedPart.material.color,
      });
  }
}
  
// Function to handle the raycasting logic
function onDocumentMouseMove(event) {
  event.preventDefault();

  // Calculate mouse position in normalized device coordinates

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(shoeMeshes, true);

  // Reset color for all shoe parts except the hovered or selected part
  shoeMeshes.forEach(mesh => {
    if (mesh !== selectedPart) {
      // Only reset color if a color has not been chosen for this part
      if (!partColors.has(mesh.uuid)) {
        mesh.material.color.set(0xffffff); // Reset color
      }
    }
  });

  if (intersects.length > 0) {
    hoveredPart = intersects[0].object;

    // Change the material color or apply a hover effect (customize based on your needs)
    if (hoveredPart !== selectedPart) {
      // Only set the hover color if a color has not been chosen for this part
      if (!partColors.has(hoveredPart.uuid)) {
        hoveredPart.material.color.set(0xC0C0C0); // Hover color
      }
    }
  } else {
    // If no intersection, reset hoveredPart
    hoveredPart = null;
  }
}

window.addEventListener('mousemove', onDocumentMouseMove, false);

document.querySelectorAll('.box-container').forEach(container => {
  container.style.display = 'none';
});

// Hide all fabric options
document.querySelectorAll('.fabric-container').forEach(container => {
  container.style.display = 'none';
});
const neonPinkContainer = document.querySelector('.box.neon-pink');
console.log(neonPinkContainer);

function showOptionsForPart(partName) {
  // Hide all color options

  // Show the relevant color options based on the part
  switch (partName) {
    case 'laces':
      document.querySelector('.box.neon-pink').closest('.box-container').style.display = 'flex';
      console.log('Displaying neon-pink box container for laces');
      document.querySelector('.fabric-container.leather-container').style.display = 'flex';
      document.querySelector('.fabric-container.polyester-container').style.display = 'flex';


      break;
    case 'sole_bottom':
      document.querySelectorAll('.colorOption .box-container[data-color="3498db"]').forEach(container => {
        container.style.display = 'block';
      });
      // Show fabric options for sole_bottom
      document.querySelector('.fabric-container.leather-container').style.display = 'block';
      document.querySelector('.fabric-container.metal-leather-container').style.display = 'block';
      break;
    // Add cases for other parts as needed
  }
}


function onDocumentMouseDown(event) {
  event.preventDefault();

  // Calculate mouse position in normalized device coordinates
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const isColorOption = event.target.classList.contains('box');

  if (!isColorOption) {
    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(pointer, camera);

    // Check for intersections with the shoe meshes
    const intersects = raycaster.intersectObjects(shoeMeshes, true);

    // Apply the color to the clicked part
    if (intersects.length > 0) {
      const clickedPart = intersects[0].object;

      if (selectedPart && selectedPart !== clickedPart) {
        // Remove the 'selected' class from the previously selected box-fabric
        const selectedFabric = document.querySelector('.box-fabric.selected');
        if (selectedFabric) {
          selectedFabric.classList.remove('selected');
        }
      }

      selectedPart = clickedPart;


      // Check if a color has been chosen for this part
      if (!partColors.has(selectedPart.uuid)) {
        // If no color has been chosen, set the color to black
        selectedPart.material.color.set(0xC0C0C0);
        partColors.set(selectedPart.uuid, new THREE.Color(0xC0C0C0));

           // Remove the 'selected' class from the previously selected box
           const selectedBox = document.querySelector('.box.selected');
           if (selectedBox) {
             selectedBox.classList.remove('selected');
           }
       
        // Save the name of the selected shoe part to the id attribute
        const nameElement = document.getElementById('name');
        nameElement.textContent = selectedPart.name || 'Unnamed Part';
      }

      const clickedBox = event.target;
      clickedBox.classList.add('selected');
      const clickedBoxFabric = event.target;
      clickedBoxFabric.classList.add('selected');
      showOptionsForPart(selectedPart.name.toLowerCase());

    }


      // Store the selected part for later reference
      hoveredPart = selectedPart;
    }
  }


// Add the click event listener
window.addEventListener('click', onDocumentMouseDown, false);



// clock for animation
const clock = new THREE.Clock();
const button = document.getElementById('orderButton');

document.getElementById('size').addEventListener('change', function () {
  button.disabled = this.value === ''; // Disable the button if no size is selected

  const orderButton = document.getElementById('orderButton');

  // Add a click event listener to the button
  orderButton.addEventListener('click', function() {
      // Redirect to order.html
      window.location.href = 'order.html';
  });

});

button.addEventListener('click', function () {
  // Send all customization data to the backend
  customizationData.shoeSize = document.getElementById('size').value;
  sendAllCustomizationData();
  console.log(customizationData);
  localStorage.setItem("customizationData", JSON.stringify(customizationData));
  window.location.href = "http://localhost:5173/order.html";

});

function animate() {
  const elapsedTime = clock.getElapsedTime();
  const speed = elapsedTime * 0.1;

  // change plane gradients
  planeMaterial.uniforms.time.value += 0.01;

  raycaster.setFromCamera(pointer, camera);


  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;
  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(newWidth, newHeight);
  raycaster.setFromCamera(pointer, camera);
});

animate();
