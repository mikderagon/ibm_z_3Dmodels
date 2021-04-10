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
} from '../threejs/three.module.js';

const modelPath = './ibm_Z_Anim_Cloud_v003.glb';

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
    min: 0.00001,
    max: 1,
  });
  scene.add(camera);

  renderer = initRenderer();
  document.body.appendChild(renderer.domElement);
  addPmremGenerator(renderer);

  const orbitControls = initOrbitControls({ camera, renderer });

  let model = await loadModel();
  model = setModelPosition(model);
  model = addShadows(model);
  scene.add(model.scene);

  let mixer = initMixer(model);

  mixer = animate({ spotLight, camera, orbitControls, scene, clock, mixer, renderer });
  
  animateOnTouch({ renderer, camera, model, mixer });
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
  controls.minDistance = 0.01;
  controls.maxDistance = 0.1;
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;
  controls.enablePan = false;
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

function playAnimation({ animations, mixer }) {
  animations.forEach((clip, index) => {
    const action = mixer.clipAction(clip);
    action.reset();
    action.timeScale = 1;
    action.setLoop(LoopOnce);
    action.clampWhenFinished = true;
    action.play();
  })
}

function getAnimationDuration({ animations }) {
  let time = 0;
  animations.forEach((clip) => {
    time += clip.duration;
  });
  return time;
}

function animateOnTouch({ renderer, camera, model, mixer }) {
  const { animations } = model;
  const animationDuration = getAnimationDuration({ animations });
  const TIME = animationDuration + 1;
  let timer = TIME;
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
    // drawRaycastLaser({ scene, raycaster });
    let intersects = raycaster.intersectObjects(model.scene.children, true);
    if (intersects.length && (timer > animationDuration) && !isMouseDrag(downPoint, upPoint)) {
      const thisInterval = setInterval(() => {
        timer -= 1;
        if (timer < 0) {
          clearInterval(thisInterval);
          timer = TIME;
        };
      }, 35);
      playAnimation({ animations, mixer, animationDuration });
    }
  }
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