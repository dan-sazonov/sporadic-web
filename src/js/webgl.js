import * as THREE from "three";

let sizes = {
  width: document.documentElement.scrollWidth,
  height: window.innerHeight
};

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 10000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(sizes.width, sizes.height);
document.body.appendChild(renderer.domElement);
let geometry = new THREE.BoxGeometry(700, 700, 700, 10, 10, 10);
let material = new THREE.MeshBasicMaterial({color: 0xfffff, wireframe: true});
let cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 1000;

function render() {
  requestAnimationFrame(render);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
render();
