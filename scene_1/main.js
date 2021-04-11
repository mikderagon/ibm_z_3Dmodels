import { GLTFLoader } from '../threejs/GLTFLoader.js';
import { OrbitControls } from '../threejs/OrbitControls.js';
import { PointerLockControls } from '../threejs/PointerLockControls.js';
import { DragControls } from '../threejs/DragControls.js';
import {
  Scene,
  Color,
  CameraHelper,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  HemisphereLight,
  HemisphereLightHelper,
  SpotLight,
  SpotLightHelper,
  AnimationMixer,
  AnimationClip,
  ReinhardToneMapping,
  PMREMGenerator,
  ACESFilmicToneMapping,
  Clock,
  TextureLoader,
  LoopOnce,
  sRGBEncoding,
  AxesHelper,
  Vector2,
  Raycaster,
  Vector3,
  ArrowHelper,
  CanvasTexture,
  LinearFilter,
  ClampToEdgeWrapping,
  SpriteMaterial,
  MeshPhongMaterial,
  Object3D,
  Mesh,
  Sprite,
  CylinderGeometry,
  SphereGeometry,
  PlaneGeometry,
  MeshBasicMaterial,
  DoubleSide,
  PlaneHelper,
  Plane,
  RepeatWrapping,
  DirectionalLight,
  DirectionalLightHelper,
} from '../threejs/three.module.js';

const modelPath = './ibm_Z_Anim_Cloud_v003.glb';
const floatingButtons = [
  '../assets/button1@3x.png',
  '../assets/button2@3x.png',
  '../assets/button3@3x.png',
  '../assets/button4@3x.png',
  '../assets/button5@3x.png',
];
const ringPath = '../assets/whiteCircle@3x.png';

async function main() {
  const clock = new Clock();

  let scene, camera, renderer, ibmModels;
  scene = new Scene();
  /////////////////
  // add background
  const textureLoader = new TextureLoader();
  const texture = await textureLoader.load('../assets/bg01.jpg');
  scene.background = texture;
  ///////////////////////
  // add xyz axes helpers
  const axesHelper = new AxesHelper();
  scene.add( axesHelper );
  /////////////////////////////
  // change main scene position
  scene.position.set(0, -0.01, 0);
  //////////////
  // add camera
  camera = new PerspectiveCamera(
    45, // fov
    window.innerWidth / window.innerHeight, // aspectRatio
    0.01, // min
    1000, // max
    );
  camera.position.set(0.01, 0, 0.1);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  scene.add(camera);
  ////////////////
  // camera helper
  // const cameraHelper = new CameraHelper(camera);
  // scene.add(cameraHelper);
  /////////////
  // add lights
  // const hemisphereLight = new HemisphereLight(0xffeeb1, 0x808020, 4.0);
  // scene.add(hemisphereLight);
  function addDirectionLight(x, y, z) {
    const directionalLight = new DirectionalLight(0xffffff, 5);
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);
    const directionalLightHelper = new DirectionalLightHelper(directionalLight);
    scene.add(directionalLightHelper);
  }
  addDirectionLight(5, 2, 3);
  addDirectionLight(-5, 2, -3);

  const spotLight = new SpotLight(0xd3d3d3, 4.0);
  spotLight.position.set(
    5, 12, 0
    // camera.position.x + 11,
    // camera.position.y + 14,
    // camera.position.z + 10,
  )
  spotLight.target = camera;
  spotLight.castShadow = true;
  spotLight.shadow.bias = -0.0001;
  spotLight.shadow.mapSize.width = 1024 * 4;
  spotLight.shadow.mapSize.height = 1024 * 4;
  // scene.add(spotLight);
  ///////////////////
  // spotlight helper
  // const spotLightHelper = new SpotLightHelper(spotLight);
  // scene.add(spotLightHelper);
  ///////////////
  // add renderer
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.toneMapping = ReinhardToneMapping;
  renderer.toneMapping = ACESFilmicToneMapping;
  // renderer.toneMappingExposure = 2.3;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = sRGBEncoding;
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  /////////////////////
  // add pmremGenerator
  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  /////////////////
  // orbit controls
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.dampingFactor = 1.0;
  // orbitControls.minDistance = 0.01;
  // orbitControls.maxDistance = 0.1;
  orbitControls.minPolarAngle = Math.PI / 2;
  orbitControls.maxPolarAngle = Math.PI / 2;
  orbitControls.enablePan = false;
  orbitControls.update();
  /////////////
  // load model
  async function loadModel(position) {
    const loader = new GLTFLoader();
    const model = await new Promise((resolve, reject) => {
      loader.load(modelPath, (model) => {
        resolve(model);
      })
    })
    console.log(model)
    model.scene.position.set(...position);
    return model;
  }
  const model1 = await loadModel([0.003, -0.015, 0]);
  const model2 = await loadModel([-0.0035, -0.015, 0]);
  const model3 = await loadModel([-0.01, -0.015, 0]);
  /////////////////////
  // add model to scene
  scene.add(model1.scene);
  scene.add(model2.scene);
  // scene.add(model3.scene);
  ///////////////////////////////
  // create Materials for Buttons
  function createMat(texturePath) {
    const texture = new TextureLoader().load(texturePath);
    // tex.wrapS = RepeatWrapping;
    // tex.wrapT = RepeatWrapping;
    // tex.repeat.set(4, 4);
    return new MeshBasicMaterial({
      map: texture,
      side: DoubleSide,
      transparent: true,
      // alphaTest: 0.1,
    });
  }
  /////////////////////////////////
  // initialize plane for Materials
  function initPlane(mat, position, size) {
    const [x, y, z] = position;
    const segmentSize = 1;
    const geometry = new PlaneGeometry(size, size, segmentSize, segmentSize);
    const plane = new Mesh(geometry, mat);
    plane.name = "button";
    plane.position.set(x, y, z);
    return plane;
  }
  const planes = [];
  function initButton(button, position) {
    const mat = createMat(button);
    const ring = createMat(ringPath);

    const buttonPlane = initPlane(mat, position, 0.005);
    const ringPlane = initPlane(ring, position, 0.006);

    planes.push(buttonPlane);
    planes.push(ringPlane);
    model1.scene.add(buttonPlane);
    model1.scene.add(ringPlane);
  }
  initButton(floatingButtons[0], [-0.002, 0.02, 0.01]);
  initButton(floatingButtons[1], [-0.002, 0.03, 0.01]);
  initButton(floatingButtons[2], [0.002, 0.01, 0.01]);
  initButton(floatingButtons[3], [0.005, 0.03, 0.01]);
  initButton(floatingButtons[4], [0.004, 0.02, 0.01]);

  //////////////////////
  // detect button touch
  let downPoint = {};
  let upPoint = {};
  renderer.domElement.addEventListener('pointerdown', event => {
    downPoint = { x: event.clientX, y: event.clientY };
  })
  renderer.domElement.addEventListener('pointerup', event => {
    upPoint = { x: event.clientX, y: event.clientY };
  })
  renderer.domElement.addEventListener('click', onMouseClick, true);
  let raycaster = new Raycaster();
  const mouse = new Vector2();
  function onMouseClick(event) {
    function isMouseDrag(down, up) {
      return (down.x !== up.x) || (down.y !== up.y)
    }
    mouse.x = event.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const buttonModels = model1.scene.children.filter(c => c.name === 'button');
    let intersects = raycaster.intersectObjects(buttonModels, true);
    if (intersects.length && !isMouseDrag(downPoint, upPoint)) {
      let positionInModels = buttonModels.findIndex(b => b.id === intersects[0].object.id);
      if (positionInModels % 2 == 0) positionInModels++;
      positionInModels++;
      const buttonPressed = positionInModels/2;
      console.log(`clicked on button#${buttonPressed}`)
      if (buttonPressed === 1) {
        removeAllButtons();
        centerServers();
        scene.remove(model3.scene);
      }
      if (buttonPressed === 4) {
        scene.add(model3.scene);
      }
    }
  }
  /////////////////////
  // add all buttons
  function addAllButtons() {
    planes.forEach(plane => {
      model1.scene.add(plane)
    })  
  }
  /////////////////////
  // remove all buttons
  function removeAllButtons() {
    planes.forEach(plane => {
      model1.scene.remove(plane)
    })  
  }
  // removeAllButtons();
  ////////////////////////////////
  // animation to center server(s)
  function centerServers() {
    model1.scene.position.set(0.003, -0.015, 0);
    orbitControls.reset();
  }
  //////////////////////////
  // add shadows to ibmModel
  model1.scene.children.forEach(c => c.traverse(n => {
    if (n.type === 'Mesh') {
      n.castShadow = true;
      n.receiveShadow = true;
      if (n.material.map) n.material.map.anisotropy = 16;
    }
  }))
  ///////////////////
  // initialize mixer
  const mixer = new AnimationMixer(model1.scene);
  //////////////
  // render loop
  const delta = clock.getDelta();
  function render() {
    orbitControls.update();
    planes.forEach(plane => {
      plane.rotation.setFromRotationMatrix(camera.matrix);
    })
    mixer.update(delta);  
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
}

main();

/////////////
// helpers //
/////////////

function drawRaycastLaser({ scene, raycaster }) {
  scene.add(new ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 300, 0xff0000));
  return scene;
}