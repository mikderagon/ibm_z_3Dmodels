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
  MeshLambertMaterial,
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
  ibmModels = [];
  scene = new Scene();
  /////////////////
  // add background
  const textureLoader = new TextureLoader();
  const texture = await textureLoader.load('../assets/bg01.jpg');
  scene.background = texture;
  ///////////////////////
  // add xyz axes helpers
  const axesHelper = new AxesHelper();
  // scene.add( axesHelper );
  /////////////////////////////
  // change main scene position
  scene.position.set(0, -0.005, 0);
  //////////////
  // add camera
  camera = new PerspectiveCamera(
    45, // fov
    window.innerWidth / window.innerHeight, // aspectRatio
    0.01, // min
    1000, // max
    );
  camera.position.set(0.015, 0.001, 0.05);
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
    const directionalLight = new DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);
    const directionalLightHelper = new DirectionalLightHelper(directionalLight);
    // scene.add(directionalLightHelper);
  }
  addDirectionLight(0.1, 1, 3);
  addDirectionLight(0.1, 1, -3);
  addDirectionLight(5, 2, 3);
  addDirectionLight(-5, 2, 3);
  addDirectionLight(-5, 2, -3);
  addDirectionLight(5, 2, -3);

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
  /////////////
  // load model
  async function loadModel(position) {
    const loader = new GLTFLoader();
    const model = await new Promise((resolve, reject) => {
      loader.load(modelPath, (model) => {
        resolve(model);
      })
    })
    model.scene.position.set(...position);
    ibmModels.push(model);
  }
  /////////////////////
  // add models to scene
  const initialPosition = [0.0, -0.011, 0.001];
  await loadModel(initialPosition);

  function reloadModels() {
    ibmModels = ibmModels.slice(0, 4);
    ibmModels.forEach(model => {
      scene.add(model.scene);
    })  
  }
  reloadModels();
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
    const segmentSize = 1;
    const geometry = new PlaneGeometry(size, size, segmentSize, segmentSize);
    const plane = new Mesh(geometry, mat);
    plane.name = "button";
    plane.position.set(...position);
    return plane;
  }
  const planes = [];
  function initButton(button, position, model) {
    const mat = createMat(button);
    const ring = createMat(ringPath);

    const buttonPlane = initPlane(mat, position, 0.0018);
    const ringPlane = initPlane(ring, position, 0.0024);

    planes.push(buttonPlane);
    planes.push(ringPlane);
    model.scene.add(buttonPlane);
    model.scene.add(ringPlane);
  }
  initButton(floatingButtons[0], [-0.001, 0.0205, 0.007], ibmModels[0]);
  initButton(floatingButtons[1], [-0.001, 0.015, 0.007], ibmModels[0]);
  initButton(floatingButtons[2], [0.006, 0.015, 0.007], ibmModels[0]);
  initButton(floatingButtons[3], [0.002, 0.01, 0.007], ibmModels[0]);
  initButton(floatingButtons[4], [0.0006, 0.0058, 0.007], ibmModels[0]);

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
  async function onMouseClick(event) {
    function isMouseDrag(down, up) {
      return (down.x !== up.x) || (down.y !== up.y)
    }
    mouse.x = event.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const buttonModels = ibmModels[0].scene.children.filter(c => c.name === 'button');
    let intersects = raycaster.intersectObjects(buttonModels, true);
    if (intersects.length && !isMouseDrag(downPoint, upPoint)) {
      let positionInModels = buttonModels.findIndex(b => b.id === intersects[0].object.id);
      if (positionInModels % 2 == 0) positionInModels++;
      positionInModels++;
      const buttonPressed = positionInModels/2;
      // console.log(`clicked on button#${buttonPressed}`)
      if (buttonPressed === 1) {
        // removeAllButtons();
        if (ibmModels.length < 4) {
          addServer();
        }
      }
      if (buttonPressed === 2) {
        // removeAllButtons();
        if (ibmModels.length > 1) {
          removeServer();
        }
      }
      if (buttonPressed === 5) {
        removeAllButtons();
      }
    }
  }
  /////////////////////
  // add all buttons
  function addAllButtons() {
    planes.forEach(plane => {
      ibmModels[0].scene.add(plane)
    })  
  }
  /////////////////////
  // remove all buttons
  function removeAllButtons() {
    planes.forEach(plane => {
      ibmModels[0].scene.remove(plane)
    })  
  }
  // removeAllButtons();
  async function addServer() {
    await loadModel([0,0,0]);
    reloadModels();
    centerServers();
  }
  function removeServer() {
    const deletedModel = ibmModels.pop();
    scene.remove(deletedModel.scene)
    reloadModels();
    centerServers();
  }
  ////////////////////////////////
  // animation to center server(s)
  function centerServers() {
    if (!ibmModels.length) return;
    if (ibmModels.length === 1) {
      ibmModels[0].scene.position.set(...initialPosition)
    }
    if (ibmModels.length === 2) {
      ibmModels[0].scene.position.set(...[
        initialPosition[0] - 0.0035,
        initialPosition[1],
        initialPosition[2],
      ])
      ibmModels[1].scene.position.set(...[
        initialPosition[0] + 0.0035,
        initialPosition[1],
        initialPosition[2],
      ])
    }
    if (ibmModels.length === 3) {
      ibmModels[0].scene.position.set(...[
        initialPosition[0] - 0.007,
        initialPosition[1],
        initialPosition[2],
      ])
      ibmModels[1].scene.position.set(...[
        initialPosition[0] + 0.007,
        initialPosition[1],
        initialPosition[2],
      ])
      ibmModels[2].scene.position.set(...[
        initialPosition[0] + 0,
        initialPosition[1],
        initialPosition[2],
      ])
    }
    if (ibmModels.length === 4) {
      ibmModels[0].scene.position.set(...[
        initialPosition[0] - 0.0105,
        initialPosition[1],
        initialPosition[2],
      ])
      ibmModels[1].scene.position.set(...[
        initialPosition[0] - 0.0035,
        initialPosition[1],
        initialPosition[2],
      ])
      ibmModels[2].scene.position.set(...[
        initialPosition[0] + 0.0035,
        initialPosition[1],
        initialPosition[2],
      ])
      ibmModels[3].scene.position.set(...[
        initialPosition[0] + 0.0105,
        initialPosition[1],
        initialPosition[2],
      ])
    }
    orbitControls.reset();
  }
  //////////////////////////
  // add shadows to ibmModel
  ibmModels.forEach(model => {
    model.scene.children.forEach(c => c.traverse(n => {
      if (n.type === 'Mesh') {
        n.castShadow = true;
        n.receiveShadow = true;
        if (n.material.map) n.material.map.anisotropy = 16;
      }
    }))
  });
  ///////////////////
  // initialize mixer
  let mixers = []
  ibmModels.forEach(model => {
    mixers.push(new AnimationMixer(model.scene))
  })
  // const mixer = new AnimationMixer(ibmModels[0].scene);
  //////////////
  // render loop
  const delta = clock.getDelta();
  function render() {
    // orbitControls.update();
    // camera.updateProjectionMatrix();
    planes.forEach(plane => {
      plane.rotation.setFromRotationMatrix(camera.matrix);
    })
    mixers.forEach(mixer => mixer.update(delta))
    // mixer.update(delta);
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