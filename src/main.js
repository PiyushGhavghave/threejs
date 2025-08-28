import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

// basic setup - scene, camera, renderer
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(30);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.render(scene, camera);


// add object in scene - geometry, material, mesh
const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xFF6347 });

const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

// add light in scene
/*
const pointLight  = new THREE.PointLight(0xFFFFFF);
pointLight.position.set(0,0,10);
scene.add(pointLight);
*/

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);

//add helper
/*
const lightHelper = new THREE.PointLightHelper(pointLight);
scene.add(lightHelper);
*/

// add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// add starts
function addStars(){
  const geometry = new THREE.SphereGeometry(0.25);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
  star.position.set(x, y, z);
  scene.add(star);
}
Array(200).fill().forEach(addStars);

// add image (space)
const spaceTexture = new THREE.TextureLoader().load('/space.jpg');
scene.background = spaceTexture;

function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  controls.update();

  renderer.render(scene, camera);
}

animate();
