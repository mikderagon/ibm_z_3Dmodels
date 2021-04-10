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
} from '../threejs/three.module.js';

let loadedModel;

const scene = new Scene();
const textureLoader = new TextureLoader();
textureLoader.load('../assets/bg01.jpg', (texture) => {
  scene.background = texture;
})

const axesHelper = new AxesHelper();
// scene.add( axesHelper );
scene.position.set(0, -0.01, 0);

const camera = new PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.00001, 1);
camera.position.set(0.3, 0, 1.5);
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
const cameraHelper = new CameraHelper(camera);
// scene.add(cameraHelper);
scene.add(camera);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.toneMapping = ReinhardToneMapping;
renderer.toneMapping = ACESFilmicToneMapping;
// renderer.toneMappingExposure = 2.3;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = sRGBEncoding;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const hemisphereLight = new HemisphereLight(0xffeeb1, 0x808020, 4.0);
scene.add(hemisphereLight);

const ambientLight = new AmbientLight(0xffeeb1, 2.0);
// scene.add(ambientLight);

const spotLight = new SpotLight(0xffa95c, 4.0);
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;
spotLight.shadow.mapSize.width = 1024 * 4;
spotLight.shadow.mapSize.height = 1024 * 4;
scene.add(spotLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.dampingFactor = 1.0;
controls.minDistance = 0.01;
controls.maxDistance = 0.1;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = false;
controls.update();
controls.addEventListener('change', event => {
  console.log(event);
})

const pointerLocks = new PointerLockControls(camera, renderer.domElement);

pointerLocks.addEventListener('lock', (event) => {
  console.log('mouse touched')
  console.log(event)
})

pointerLocks.addEventListener('change', (event) => {
  console.log('mouse touched')
  console.log(event)
})


const loader = new GLTFLoader();
loader.load('./ibm_Z_Anim_Cloud_v003.glb', (animatedObject) => {
  let loadedModel = animatedObject;
  const model = animatedObject.scene.children[0];
  model.traverse(n => {
    if (n.isMesh) {
      n.castShadow = true;
      n.receiveShadow = true;
      if (n.material.map) n.material.map.anisotropy = 16;
    }
  })

  const dragControls = new DragControls(animatedObject, camera, renderer.domElement);
  dragControls.addEventListener('dragstart', (event) => {
    console.log(event)
  })

  animatedObject.scene.position.set(0.003, 0, 0);

  const mixer = new AnimationMixer(animatedObject.scene);
  const { animations } = animatedObject;

  const clock = new Clock();

  function update () {
    const delta = clock.getDelta();
    mixer.update( delta );
  }

  function playAnimation() {
    animations.forEach(clip => {
      const action = mixer.clipAction(clip);
      action.reset();
      action.timeScale = 1;
      action.setLoop(LoopOnce);
      action.clampWhenFinished = true;
      action.play();
    })
  }

  scene.add(animatedObject.scene);

  function animate() {
    spotLight.position.set(
      camera.position.x + 10,
      camera.position.y + 10,
      camera.position.z + 10,
    )
    update();
    controls.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}, undefined, (err) => {
  console.error(err);
});