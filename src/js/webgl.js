import * as THREE from "three";
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {angles} from './main';

let sizes = {
  width: document.documentElement.scrollWidth,
  height: window.innerHeight
};

let scene = new THREE.Scene();
//let light = new THREE.PointLight(0xFFFFFF, 1.4, 1000);
//scene.add(light)
let camera = new THREE.PerspectiveCamera(1, sizes.width / sizes.height, 1, 10000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(sizes.width, sizes.height);
document.body.appendChild(renderer.domElement);
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-10, 0, 10),
  new THREE.Vector3(-5, 5, 5),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(5, -5, 5),
  new THREE.Vector3(10, 0, 10)
]);

const points = curve.getPoints(50);
const geometry = new THREE.BufferGeometry().setFromPoints(points);

const material = new THREE.LineBasicMaterial({color: 0xff0000});

// Create the final object to add to the scene
const curveObject = new THREE.Line(geometry, material);
let geometrye = new THREE.ConeBufferGeometry(5, 20, 32);
//geometrye.rotateX(0);
//geometrye.rotateY(0);
//geometrye.rotateZ(0);
//let geometry = new THREE.BoxGeometry(400, 700, 400, 10, 10, 10);
//geometry.rotateX(0);
//geometry.rotateY(0);
//geometry.rotateZ(0);
//let material = new THREE.MeshBasicMaterial({color: 0xfffff, wireframe: true});
let materiale = new THREE.MeshBasicMaterial({color: 0xDD1155, wireframe: true});
//let cube = new THREE.Mesh(geometry, material);
let cone = new THREE.Mesh(geometrye, materiale);
scene.add(cone);
//scene.add(cube);
const axesHelper = new THREE.AxesHelper(25);

scene.add(axesHelper);
camera.position.z = 50;
const controls = new OrbitControls(camera, renderer.domElement);

function render() {
  requestAnimationFrame(render);
  cone.rotation.x = angles?.[0];
  cone.rotation.y = angles?.[1];
  cone.rotation.z = angles?.[2];

  controls.update();
  renderer.render(scene, camera);
}

render();

export {renderer, camera, scene}
