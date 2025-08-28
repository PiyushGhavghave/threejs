import './style.css';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

// -- Scene Setup --
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 100;

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);

// -- Mouse Interaction --
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// -- Particle Variables --
let points;
let originalPositions;
const repelRadius = 40;
const repelStrength = 0.5;
const returnStrength = 0.02;
const friction = 0.95;

// -- Font Loading and Text Creation --
const fontLoader = new FontLoader();
fontLoader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
  const FONT_SIZE = 40;
  const TARGET_PARTICLES = 15000;
  const particlePositions = [];

  // Step 1: Generate 2D shapes for the text
  const shapes = font.generateShapes('Matlync', FONT_SIZE);
  const geometry = new THREE.ShapeGeometry(shapes);
  geometry.center(); // Center the text geometry

  // Step 2: Triangulate the shapes and prepare for sampling
  const triangles = [];
  const vertices = geometry.attributes.position.array;
  const indices = geometry.index.array;
  let totalArea = 0;

  for (let i = 0; i < indices.length; i += 3) {
    const a = new THREE.Vector3(vertices[indices[i] * 3], vertices[indices[i] * 3 + 1], 0);
    const b = new THREE.Vector3(vertices[indices[i + 1] * 3], vertices[indices[i + 1] * 3 + 1], 0);
    const c = new THREE.Vector3(vertices[indices[i + 2] * 3], vertices[indices[i + 2] * 3 + 1], 0);
    const area = new THREE.Triangle(a, b, c).getArea();
    triangles.push({ a, b, c, area });
    totalArea += area;
  }

  // Step 3: Sample random points from the triangles
  for (let i = 0; i < TARGET_PARTICLES; i++) {
    // Pick a random triangle weighted by its area
    let randomArea = Math.random() * totalArea;
    let selectedTriangle;
    for (const triangle of triangles) {
      randomArea -= triangle.area;
      if (randomArea <= 0) {
        selectedTriangle = triangle;
        break;
      }
    }

    // Generate a random point inside the selected triangle using barycentric coordinates
    let r1 = Math.sqrt(Math.random());
    let r2 = Math.random();
    const x = (1 - r1) * selectedTriangle.a.x + (r1 * (1 - r2)) * selectedTriangle.b.x + (r1 * r2) * selectedTriangle.c.x;
    const y = (1 - r1) * selectedTriangle.a.y + (r1 * (1 - r2)) * selectedTriangle.b.y + (r1 * r2) * selectedTriangle.c.y;

    particlePositions.push(x, y, 0);
  }

  const finalPositions = new Float32Array(particlePositions);
  const particleVelocities = new Float32Array(finalPositions.length).fill(0);
  const particleGeometry = new THREE.BufferGeometry();
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(finalPositions, 3));
  particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(particleVelocities, 3));

  originalPositions = new Float32Array(finalPositions);

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x42a5f5,
    size: 0.5,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.9,
  });

  points = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(points);
});

// -- Animation Loop --
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouseWorldPosition = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  if (points) {
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, mouseWorldPosition);

    const positions = points.geometry.attributes.position.array;
    const velocities = points.geometry.attributes.velocity.array;

    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3;
      const particlePosition = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      
      const distance = particlePosition.distanceTo(mouseWorldPosition);

      if (distance < repelRadius) {
        const repelForce = new THREE.Vector3()
          .subVectors(particlePosition, mouseWorldPosition)
          .normalize()
          .multiplyScalar((repelRadius - distance) / repelRadius)
          .multiplyScalar(repelStrength);
        
        velocities[i3] += repelForce.x;
        velocities[i3 + 1] += repelForce.y;
      }
      
      const originalPos = new THREE.Vector3(originalPositions[i3], originalPositions[i3 + 1], originalPositions[i3 + 2]);
      const returnForce = new THREE.Vector3().subVectors(originalPos, particlePosition).multiplyScalar(returnStrength);

      velocities[i3] += returnForce.x;
      velocities[i3 + 1] += returnForce.y;
      velocities[i3 + 2] += returnForce.z;

      velocities[i3] *= friction;
      velocities[i3 + 1] *= friction;
      velocities[i3 + 2] *= friction;

      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
    }
    
    points.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

animate();

// -- Handle window resize --
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});