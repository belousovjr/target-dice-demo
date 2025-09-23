import CANNON from "cannon";
import * as THREE from "three";
import {
  CubeData,
  CubeDataForRender,
  FaceIndex,
  Quaternion,
  RollReadyState,
  SceneAssets,
  SceneData,
  SceneDataForRender,
  Vector3,
} from "../types";
import {
  boxShape,
  cubeDefaultY,
  cubeMaterialsNumbers,
  cubeOffset,
  cubeSize,
  diceGroundContact,
  diceMaterial,
  faceVectors,
  loadingRotateStep,
  maxDisplayWidth,
  maxDistance,
  minDistance,
  restConfirmations,
  stepsConfirmations,
  trayGeo,
  trayMaterial,
  traySizes,
} from "./constants";
import {
  BufferGeometryUtils,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import createDiceTextures from "dice-textures";

export function syncMesh(cubeData: CubeDataForRender) {
  cubeData.mesh.position.copy(cubeData.body.position);
  cubeData.mesh.quaternion.copy(cubeData.body.quaternion);
}

export function calcCubePosition(cubesQty: number, cubeIndex: number): Vector3 {
  return [(cubeIndex - (cubesQty - 1) / 2) * cubeOffset, cubeDefaultY, 0];
}

function processInChunks<T, R>(
  data: T[],
  callback: (item: T, index: number, array: T[]) => R,
  chunkSize: number = 50
): Promise<R[]> {
  const results: R[] = [];
  return new Promise((resolve) => {
    let index = 0;

    function processChunk() {
      const end = Math.min(index + chunkSize, data.length);
      for (; index < end; index++) {
        results.push(callback(data[index], index, data));
      }

      if (index < data.length) {
        requestAnimationFrame(processChunk);
      } else {
        resolve(results);
      }
    }

    requestAnimationFrame(processChunk);
  });
}

export async function loadAssets(
  canvas: HTMLCanvasElement
): Promise<SceneAssets> {
  const loader = new THREE.TextureLoader();
  const [albedo, ao, normal, ...dice] = await Promise.all([
    ...[
      "/polystyrene/rough-polystyrene_albedo.png",
      "/polystyrene/rough-polystyrene_ao.png",
      "/polystyrene/rough-polystyrene_normal-ogl.png",
      ...createDiceTextures(
        { size: 100, color: "white", pipColor: "black" },
        { quality: 1 }
      ),
    ].map(
      (item) =>
        new Promise<THREE.Texture>((resolve) => loader.load(item, resolve))
    ),
  ]);

  const diceRenderMat = cubeMaterialsNumbers.map((index) => {
    const map = dice[index - 1];
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: map,
    });
  });

  const trayRenderMat = new THREE.MeshStandardMaterial({
    color: 0x1e5eff,
    map: albedo,
    aoMap: ao,
    normalMap: normal,
  });

  const prepGeometry = trayGeo.map(
    ([size, pos, rot]) =>
      new THREE.Mesh(
        new THREE.BoxGeometry(...size).rotateY(rot ?? 0).translate(...pos)
      )
  );

  const unitedGeometry = BufferGeometryUtils.mergeVertices(
    BufferGeometryUtils.mergeGeometries(
      prepGeometry.map((m) => m.geometry),
      false
    ),
    0.001
  );

  const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

  const trayMesh = new THREE.Mesh(unitedGeometry, trayRenderMat);
  const diceMesh = new THREE.Mesh(cubeGeo, diceRenderMat);

  trayMesh.receiveShadow = true;
  trayMesh.castShadow = true;

  diceMesh.receiveShadow = true;
  diceMesh.castShadow = true;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    alpha: true,
  });
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.enabled = true;

  await processInChunks(
    [albedo, ao, normal, ...dice],
    (texture) => {
      renderer.initTexture(texture);
    },
    1
  );

  return {
    tray: trayMesh,
    dice: diceMesh,
    renderer,
  };
}

function createTray(assets?: SceneAssets) {
  const body = new CANNON.Body({
    mass: 0,
    material: trayMaterial,
  });

  for (const [size, pos, rot = 0] of trayGeo) {
    const shape = new CANNON.Box(
      new CANNON.Vec3(...(size as [number, number, number]).map((v) => v / 2))
    );

    const shapeQuat = new CANNON.Quaternion();
    shapeQuat.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rot as number);

    body.addShape(
      shape,
      new CANNON.Vec3(...(pos as [number, number, number])),
      shapeQuat
    );
  }

  if (!assets) {
    return { body };
  }

  const mesh = assets.tray;

  return { mesh, body };
}

export function createCube(position: Vector3, assets?: SceneAssets) {
  const body = new CANNON.Body({
    mass: 1,
    shape: boxShape,
    position: new CANNON.Vec3(...position),
    material: diceMaterial,
  });
  body.linearDamping = 0.01;
  body.angularDamping = 0.1;

  let mesh: THREE.Mesh | undefined;

  if (assets) {
    const mesh = assets.dice.clone();

    const cubeData = { body, mesh };

    syncMesh(cubeData as CubeDataForRender);

    return cubeData;
  } else {
    return { body, mesh };
  }
}

export function createScene(
  cubesQty: number,
  assets: null,
  oldSceneData?: SceneDataForRender
): SceneData;
export function createScene(
  cubesQty: number,
  assets: SceneAssets,
  oldSceneData?: SceneDataForRender
): SceneDataForRender;
export function createScene(
  cubesQty: number,
  assets: SceneAssets | null,
  oldSceneData?: SceneDataForRender
): SceneData | SceneDataForRender {
  const world = new CANNON.World();
  world.gravity.set(0, 0, 0);
  world.addContactMaterial(diceGroundContact);

  const tray = oldSceneData?.tray ?? createTray(assets ?? undefined);
  world.addBody(tray.body);

  const scene = assets ? new THREE.Scene() : undefined;

  const cubesGroup = scene ? new THREE.Group() : undefined;
  const cubes: CubeData[] = [];

  for (let i = 0; i < cubesQty; i++) {
    const cubeData = createCube(
      calcCubePosition(cubesQty, i),
      assets ?? undefined
    );
    cubes.push(cubeData);
    world.addBody(cubeData.body);
    cubesGroup?.add((cubeData as CubeDataForRender).mesh!);
  }

  const result: SceneData = { world, cubes, tray };
  if (!assets || !scene || !cubesGroup) return result;

  scene.background = null;
  scene.add(cubesGroup, tray.mesh!);

  const { w, h } = calcScreenSizes();

  const { renderer } = assets;
  const camera = new THREE.PerspectiveCamera(
    getFovRange().max,
    w / h,
    0.1,
    1000
  );
  renderer.setSize(w, h, false);

  if (!oldSceneData) {
    camera.position.set(0, cubeSize * 12, cubeSize * 7.7);
  }

  oldSceneData?.controls.dispose();

  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {
    enableDamping: true,
    dampingFactor: 0.05,
    enablePan: false,
    enableZoom: true,
    maxPolarAngle: Math.PI / 2 - 0.4,
    minDistance,
    maxDistance,
  });

  if (oldSceneData) {
    controls.target.copy(oldSceneData.controls.target);
    camera.position.copy(oldSceneData.camera.position);
    camera.quaternion.copy(oldSceneData.camera.quaternion);
    camera.fov = oldSceneData.camera.fov;
    camera.updateProjectionMatrix();
  }
  controls.update();

  const light = new THREE.DirectionalLight(0xffffff, 1);
  Object.assign(light.position, {
    x: cubeSize * 8,
    y: cubeSize * 20,
    z: -cubeSize * 4,
  });
  light.castShadow = true;

  Object.assign(light.shadow.camera, {
    left: -traySizes.x,
    right: traySizes.x,
    top: traySizes.x,
    bottom: -traySizes.x,
  });
  light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
  scene.add(light, new THREE.AmbientLight(0xffffff, 0.1));

  return { ...result, scene, renderer, camera, cubesGroup, controls };
}

export function moveBodyTowards(
  posV: Vector3,
  targetV: Vector3,
  step = 0.05,
  minDelta = 0.01
): { vector: Vector3; isDone: boolean } {
  const pos = new CANNON.Vec3(...posV);
  const target = new CANNON.Vec3(...targetV);
  const delta = target.vsub(pos);
  const dist = delta.length();
  if (dist < minDelta) {
    return { vector: targetV, isDone: true };
  }
  const dir = delta.scale(1 / dist);
  const offset = dir.scale(Math.min(step, dist));
  pos.vadd(offset, pos);
  return {
    vector: pos.toArray() as Vector3,
    isDone: false,
  };
}

export function rotateBodyTowards(
  rotateV: Quaternion,
  targetV: Quaternion,
  step = 0.08,
  threshold = 0.001
): { quant: Quaternion; isDone: boolean } {
  const rotate = new THREE.Quaternion(...rotateV);
  const target = new THREE.Quaternion(...targetV);
  const angle = rotate.angleTo(target);
  if (angle < threshold) {
    return {
      quant: targetV,
      isDone: true,
    };
  }
  rotate.slerp(target, step);
  rotate.normalize();
  return {
    quant: rotate.toArray(),
    isDone: false,
  };
}

export function getRandomQuaternion() {
  const q = new CANNON.Quaternion(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  );
  q.normalize();
  return q.toArray() as Quaternion;
}

export function getRandomVector3() {
  return [
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
  ] as Vector3;
}

export function genRollReadyState(): RollReadyState {
  const v: Vector3 = getRandomVector3();
  const angleVelocity = v.map(
    (item) => 4 * Math.sign(item) + item * 2
  ) as Vector3;
  const velocity = v.map(
    (item) => item * 0.4 + Math.sign(item) * 0.2
  ) as Vector3;
  velocity[1] = 8 + 4 * Math.random();
  return {
    rotate: getRandomQuaternion(),
    angleVelocity,
    velocity,
  };
}

export function calcLoadingStep(
  loadingQuant: THREE.Quaternion,
  angleVelocity: Vector3
) {
  const quant = loadingQuant
    .clone()
    .multiply(
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler().setFromVector3(
          new THREE.Vector3(...angleVelocity)
            .normalize()
            .multiplyScalar(loadingRotateStep)
        )
      )
    );
  const angle = 2 * Math.acos(Math.min(Math.max(quant.w, -1), 1));
  const isStartPosition =
    loadingQuant.w !== 1 &&
    Math.min(Math.abs(Math.PI * 2 - angle), angle) < loadingRotateStep;
  return {
    quant,
    isStartPosition,
  };
}

export function compareArrays<T>(a: T[], b: T[]) {
  return a.length === b.length && JSON.stringify(a) === JSON.stringify(b);
}

export function getFaceRotationQuant(from: FaceIndex, to: FaceIndex) {
  const fromVec = faceVectors[from];
  const toVec = faceVectors[to];
  return new THREE.Quaternion().setFromUnitVectors(fromVec, toVec).invert();
}

export function getRestChecker(sceneData: SceneData) {
  let finalConfirmation = 0;
  let steps = 0;
  return () => {
    const sumVelocity = sceneData.cubes.reduce(
      (res, { body }) =>
        res + body.velocity.length() + body.angularVelocity.length(),
      0
    );
    steps++;

    if (
      steps >= stepsConfirmations ||
      sumVelocity / sceneData.cubes.length < 0.01
    ) {
      finalConfirmation++;
      if (finalConfirmation >= restConfirmations) {
        return true;
      }
    } else {
      finalConfirmation = 0;
    }
    return false;
  };
}

export function applyRollReadyStates(
  sceneData: SceneData,
  states: RollReadyState[]
) {
  const { cubes } = sceneData;

  for (let i = 0; i < cubes.length; i++) {
    const cubeData = cubes[i];
    const rollReadyState = states[i];

    cubeData.body.quaternion.set(...rollReadyState.rotate);
    cubeData.body.angularVelocity.set(...rollReadyState.angleVelocity);

    cubeData.body.applyImpulse(
      new CANNON.Vec3(...rollReadyState.velocity),
      cubeData.body.position.clone()
    );
  }
}

export function calcTarget(target: THREE.Object3D, lookTarget?: THREE.Vector3) {
  const box = new THREE.Box3().setFromObject(target);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const targetCenter = new THREE.Vector3(0, center.y, 0);

  return lookTarget ? lookTarget.clone().lerp(targetCenter, 0.1) : targetCenter;
}

export function calcFov(camera: THREE.PerspectiveCamera, sign: -1 | 1) {
  const { max, min } = getFovRange();
  const finValue = sign > 0 ? max : min;
  if (camera.fov !== finValue) {
    camera.fov += sign * 0.025;
    if (Math.sign(finValue - camera.fov) !== sign) {
      camera.fov = finValue;
    }
    camera.updateProjectionMatrix();
  }
}

export function calcScreenSizes() {
  const factor = window.innerHeight / window.innerWidth;
  const w = Math.min(maxDisplayWidth, window.innerWidth);
  const h = factor * w;
  return { w, h };
}

export function getFovRange() {
  const max = 20 / (window.innerWidth / window.innerHeight) + 60;
  return { max, min: max - 15 };
}
