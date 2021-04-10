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
} from '../threejs/three.module.js';

const modelPath = './ibm_Z_Anim_Cloud_v003.glb';
const button1 = '../assets/button1@3x.png';
const button2 = '../assets/button2@3x.png';

async function main() {
  const clock = new Clock();

  let scene, camera, renderer;
  scene = new Scene();
  scene = await addBackground(scene);
  // scene = addHelperAxes(scene);
  scene = setScenePosition(scene);
  const lightsResult = addLights(scene);
  scene = lightsResult.scene;
  let { spotLight } = lightsResult;

  camera = initCamera({
    fov: 25,
    aspectRatio: window.innerWidth / window.innerHeight,
    // min: 0.00001,
    // max: 1,
    min: 1,
    max: 50,
  });
  scene.add(camera);

  renderer = initRenderer();
  document.body.appendChild(renderer.domElement);
  addPmremGenerator(renderer);

  const orbitControls = initOrbitControls({ camera, renderer });

  let model = await loadModel();
  model = setModelPosition(model);
  model = addShadows(model);
  // scene.add(model.scene);

  let mixer = initMixer(model);

  mixer = animate({ spotLight, camera, orbitControls, scene, clock, mixer, renderer });




  function createMat(texture) {
    return new MeshBasicMaterial({
      map: texture,
      side: DoubleSide,
      transparent: true,
      alphaTest: 0.1,
    });
  }
  const tex1 = new TextureLoader().load(button1);
  const tex2 = new TextureLoader().load(button2);
  const mat1 = createMat(tex1)
  const mat2 = createMat(tex2);

  let planeGeo = new PlaneGeometry(10, 10, 1, 2);
  console.log(planeGeo)

  planeGeo.faces[0].materialIndex = 0;
  planeGeo.faces[1].materialIndex = 0;
  planeGeo.faces[2].materialIndex = 1;
  planeGeo.faces[3].materialIndex = 1;

  let mesh = new Mesh(planeGeo, [ mat1, mat2 ]);

  scene.add(mesh);

  // planeTexture.wrapS = RepeatWrapping;
  // planeTexture.wrapT = RepeatWrapping;
  // planeTexture.repeat.set(4, 4);

  const plane = initPlane();

  scene.add(plane);
}

function initPlane() {
  const geometry = new PlaneGeometry(10, 20, 32);
  const plane = new Mesh(geometry, material);
  return plane;
}

main();

///////////////
// functions //
///////////////
async function addBackground(scene) {
  const textureLoader = new TextureLoader();
  const texture = await textureLoader.load('../assets/bg01.jpg');
  scene.background = texture;
  return scene;
}

function setScenePosition(scene) {
  scene.position.set(0, -0.01, 0);
  return scene;
}

function initCamera({ fov, aspectRatio, min, max }) {
  const camera = new PerspectiveCamera(fov, aspectRatio, min, max);
  camera.position.set(0.3, 0, 1.5);
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  return camera;
}

function initRenderer() {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.toneMapping = ReinhardToneMapping;
  renderer.toneMapping = ACESFilmicToneMapping;
  // renderer.toneMappingExposure = 2.3;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = sRGBEncoding;
  renderer.shadowMap.enabled = true;
  return renderer;
}

function addPmremGenerator(renderer) {
  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
}

function addLights(scene) {
  function addHemisphereLight() {
    const hemisphereLight = new HemisphereLight(0xffeeb1, 0x808020, 4.0);
    scene.add(hemisphereLight);    
  }
  function addAmbientLight() {
    const ambientLight = new AmbientLight(0xffeeb1, 2.0);
    scene.add(ambientLight);    
  }
  function addSpotLight() {
    const spotLight = new SpotLight(0xffa95c, 4.0);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    spotLight.shadow.mapSize.width = 1024 * 4;
    spotLight.shadow.mapSize.height = 1024 * 4;
    scene.add(spotLight);
    return spotLight;
  }
  addHemisphereLight();
  addAmbientLight();
  const spotLight = addSpotLight();
  return { scene, spotLight };
}

function initOrbitControls({ camera, renderer }) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.dampingFactor = 1.0;
  // controls.minDistance = 0.01;
  // controls.maxDistance = 0.1;
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;
  // controls.enablePan = false;
  controls.update();
  return controls;
}

function loadModel() {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(modelPath, (model) => {
      resolve(model);
    })
  })
}

function setModelPosition(model) {
  model.scene.position.set(0.003, 0, 0);
  return model;
}

function addShadows(model) {
  model.scene.children.forEach(c => c.traverse(n => {
    if (n.type === 'Mesh') {
      n.castShadow = true;
      n.receiveShadow = true;
      if (n.material.map) n.material.map.anisotropy = 16;
    }
  }))
  return model;
}

function initMixer(model) {
  const mixer = new AnimationMixer(model.scene);
  return mixer;
}

function updateMixer({ mixer, clock }) {
  const delta = clock.getDelta();
  mixer.update(delta);
  return mixer;
}

function animate(args) {
  let { spotLight, camera, orbitControls, scene, clock, mixer, renderer } = args;
  spotLight.position.set(
    camera.position.x + 10,
    camera.position.y + 10,
    camera.position.z + 10,
  )
  mixer = updateMixer({ mixer, clock });
  orbitControls.update();
  requestAnimationFrame(() => animate(args));
  renderer.render(scene, camera);
  return mixer;
}

/////////////
// helpers //
/////////////
function addHelperAxes(scene) {
  const axesHelper = new AxesHelper();
  scene.add( axesHelper );
  return scene;
}

function drawRaycastLaser({ scene, raycaster }) {
  scene.add(new ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 300, 0xff0000));
  return scene;
}