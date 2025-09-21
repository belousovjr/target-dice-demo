import CANNON from "cannon";
import * as THREE from "three";
import {
  CubeData,
  CubeDataForRender,
  FaceIndex,
  Quaternion,
  RollReadyState,
  SceneData,
  SceneDataForRender,
  Vector3,
} from "./types";
import {
  cubeDefaultY,
  cubeMaterialsNumbers,
  cubeOffset,
  cubeSize,
  faceVectors,
  loadingRotateStep,
  maxDisplayWidth,
  maxDistance,
  minDistance,
  restConfirmations,
  stepsConfirmations,
  traySizes,
} from "./constants";
import {
  BufferGeometryUtils,
  OrbitControls,
} from "three/examples/jsm/Addons.js";

export function createDiceMaterial(number: number) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#000000";
  ctx.font = "bold 150px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(number.toString(), size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  return new THREE.MeshStandardMaterial({ map: texture });
}

export function syncMesh(cubeData: CubeDataForRender) {
  cubeData.mesh.position.copy(cubeData.body.position);
  cubeData.mesh.quaternion.copy(cubeData.body.quaternion);
}

export function calcCubePosition(cubesQty: number, cubeIndex: number): Vector3 {
  return [(cubeIndex - (cubesQty - 1) / 2) * cubeOffset, cubeDefaultY, 0];
}

const trayMaterial = new CANNON.Material("ground");

const diceMaterial = new CANNON.Material("dice");

const diceGroundContact = new CANNON.ContactMaterial(
  diceMaterial,
  trayMaterial,
  {
    friction: 0.2,
    restitution: 0.4,
  }
);

const boxShape = new CANNON.Box(
  new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2)
);

function createTray() {
  const sizes = traySizes;
  const width = cubeSize * 0.3;
  const chamfer = width * 10;

  const legSize = chamfer / Math.SQRT2;

  const halfX = sizes.x / 2;
  const halfY = sizes.y / 2;
  const halfZ = sizes.z / 2;

  const midY = width / 2;
  const topY = sizes.y - width / 2;

  const chamferCut = chamfer - width * Math.SQRT2;
  const offset = (width * (Math.SQRT2 + 1)) / 4;

  const geometriesData = [
    // floor
    [
      [sizes.x - legSize * 2, width, sizes.z],
      [0, midY, 0],
    ],
    [
      [legSize, width, sizes.z - legSize * 2],
      [-halfX + legSize / 2, midY, 0],
    ],
    [
      [legSize, width, sizes.z - legSize * 2],
      [halfX - legSize / 2, midY, 0],
    ],
    [
      [chamfer, width, chamfer],
      [-halfX + legSize, midY, -halfZ + legSize],
      Math.PI / 4,
    ],
    [
      [chamfer, width, chamfer],
      [-halfX + legSize, midY, halfZ - legSize],
      Math.PI / 4,
    ],
    [
      [chamfer, width, chamfer],
      [halfX - legSize, midY, -halfZ + legSize],
      Math.PI / 4,
    ],
    [
      [chamfer, width, chamfer],
      [halfX - legSize, midY, halfZ - legSize],
      Math.PI / 4,
    ],

    // second layer
    [
      [width * 2, width, sizes.z - legSize * 2],
      [-halfX + width * 2, midY + width, 0],
    ],
    [
      [sizes.x - legSize * 2, width, width * 2],
      [0, midY + width, -halfZ + width * 2],
    ],
    [
      [width * 2, width, chamferCut],
      [
        -halfX + legSize / 2 + width / Math.SQRT2 + width / 2,
        midY + width,
        halfZ - (legSize / 2 + width / Math.SQRT2 + width / 2),
      ],
      Math.PI / 4,
    ],
    [
      [width * 2, width, chamferCut],
      [
        -halfX + legSize / 2 + width / Math.SQRT2 + width / 2,
        midY + width,
        -halfZ + legSize / 2 + width / Math.SQRT2 + width / 2,
      ],
      -Math.PI / 4,
    ],
    [
      [width * 2, width, sizes.z - legSize * 2],
      [halfX - width * 2, midY + width, 0],
    ],
    [
      [sizes.x - legSize * 2, width, width * 2],
      [0, midY + width, halfZ - width * 2],
    ],
    [
      [width * 2, width, chamferCut],
      [
        halfX - (legSize / 2 + width / Math.SQRT2 + width / 2),
        midY + width,
        halfZ - (legSize / 2 + width / Math.SQRT2 + width / 2),
      ],
      -Math.PI / 4,
    ],
    [
      [width * 2, width, chamferCut],
      [
        halfX - (legSize / 2 + width / Math.SQRT2 + width / 2),
        midY + width,
        -halfZ + legSize / 2 + width / Math.SQRT2 + width / 2,
      ],
      Math.PI / 4,
    ],

    // vertical walls
    [
      [width, sizes.y - width * 3, sizes.z - legSize * 2],
      [-halfX + width * 1.5, midY + halfY, 0],
    ],
    [
      [sizes.x - legSize * 2, sizes.y - width * 3, width],
      [0, midY + halfY, -halfZ + width * 1.5],
    ],
    [
      [width, sizes.y - width * 3, chamferCut],
      [
        -halfX + legSize / 2 + width / (2 * Math.SQRT2) + width / 2,
        midY + halfY,
        halfZ - (legSize / 2 + width / (2 * Math.SQRT2) + width / 2),
      ],
      Math.PI / 4,
    ],
    [
      [width, sizes.y - width * 3, chamferCut],
      [
        -halfX + legSize / 2 + width / (2 * Math.SQRT2) + width / 2,
        midY + halfY,
        -halfZ + legSize / 2 + width / (2 * Math.SQRT2) + width / 2,
      ],
      -Math.PI / 4,
    ],
    [
      [width, sizes.y - width * 3, sizes.z - legSize * 2],
      [halfX - width * 1.5, midY + halfY, 0],
    ],
    [
      [sizes.x - legSize * 2, sizes.y - width * 3, width],
      [0, midY + halfY, halfZ - width * 1.5],
    ],
    [
      [width, sizes.y - width * 3, chamferCut],
      [
        halfX - (legSize / 2 + width / (2 * Math.SQRT2) + width / 2),
        midY + halfY,
        halfZ - (legSize / 2 + width / (2 * Math.SQRT2) + width / 2),
      ],
      -Math.PI / 4,
    ],
    [
      [width, sizes.y - width * 3, chamferCut],
      [
        halfX - (legSize / 2 + width / (2 * Math.SQRT2) + width / 2),
        midY + halfY,
        -halfZ + legSize / 2 + width / (2 * Math.SQRT2) + width / 2,
      ],
      Math.PI / 4,
    ],

    // top
    [
      [width * 2, width, sizes.z - legSize * 2],
      [-halfX + width, topY, 0],
    ],
    [
      [sizes.x - legSize * 2, width, width * 2],
      [0, topY, -halfZ + width],
    ],
    [
      [width * 2, width, sizes.z - legSize * 2],
      [halfX - width, topY, 0],
    ],
    [
      [sizes.x - legSize * 2, width, width * 2],
      [0, topY, halfZ - width],
    ],
    [
      [width * (1 + Math.SQRT2 - 1 / Math.SQRT2), width, chamfer],
      [-halfX + legSize / 2 + offset, topY, halfZ - (legSize / 2 + offset)],
      Math.PI / 4,
    ],
    [
      [width * (1 + Math.SQRT2 - 1 / Math.SQRT2), width, chamfer],
      [-halfX + legSize / 2 + offset, topY, -halfZ + (legSize / 2 + offset)],
      -Math.PI / 4,
    ],
    [
      [width * (1 + Math.SQRT2 - 1 / Math.SQRT2), width, chamfer],
      [halfX - legSize / 2 - offset, topY, halfZ - (legSize / 2 + offset)],
      -Math.PI / 4,
    ],
    [
      [width * (1 + Math.SQRT2 - 1 / Math.SQRT2), width, chamfer],
      [halfX - legSize / 2 - offset, topY, -halfZ + (legSize / 2 + offset)],
      Math.PI / 4,
    ],
  ];

  const prepGeometry = geometriesData.map(([size, pos, rot]) =>
    new THREE.BoxGeometry(...(size as [number, number, number]))
      .rotateY((rot ?? 0) as number)
      .translate(...(pos as [number, number, number]))
  );

  const mergedGeometry = BufferGeometryUtils.mergeGeometries(prepGeometry);

  const mesh = new THREE.Mesh(
    mergedGeometry,
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
    })
  );

  const body = new CANNON.Body({
    mass: 0,
    material: trayMaterial,
  });

  for (const [size, pos, rot = 0] of geometriesData) {
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

  return { mesh, body };
}

export function createCube<
  T extends boolean,
  R = T extends true ? CubeDataForRender : CubeData
>(position: Vector3, withMesh: T): R {
  const body = new CANNON.Body({
    mass: 1,
    shape: boxShape,
    position: new CANNON.Vec3(...position),
    material: diceMaterial,
  });
  body.linearDamping = 0.01;
  body.angularDamping = 0.1;

  let mesh: THREE.Mesh | undefined;

  if (withMesh) {
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = cubeMaterialsNumbers.map(createDiceMaterial);
    mesh = new THREE.Mesh(cubeGeo, cubeMat);

    const cubeData = { body, mesh } as R;

    syncMesh(cubeData as CubeDataForRender);

    return cubeData;
  }
  return { body } as R;
}

export function createScene(cubesQty: number, canvas: null): SceneData;
export function createScene(
  cubesQty: number,
  canvas: HTMLCanvasElement,
  oldSceneData?: SceneDataForRender
): SceneDataForRender;
export function createScene(
  cubesQty: number,
  canvas: HTMLCanvasElement | null,
  oldSceneData?: SceneDataForRender
): SceneData | SceneDataForRender {
  const world = new CANNON.World();
  world.gravity.set(0, 0, 0);

  world.addContactMaterial(diceGroundContact);

  const scene = !!canvas && new THREE.Scene();

  const { mesh: trayMesh, body: trayBody } = createTray();
  world.addBody(trayBody);

  const cubesGroup = !!canvas && new THREE.Group();

  if (scene && cubesGroup) {
    scene.add(cubesGroup);
  }

  const cubes: CubeData[] = [];

  for (let i = 0; i < cubesQty; i++) {
    const cubePosition = calcCubePosition(cubesQty, i);

    const cubeData = createCube(cubePosition, !!canvas);
    cubes.push(cubeData);

    world.addBody(cubeData.body);

    if (cubesGroup) {
      cubesGroup.add((cubeData as CubeDataForRender).mesh!);
    }
  }

  const result = {
    world,
    cubes,
  };

  if (scene && cubesGroup) {
    scene.background = new THREE.Color(0xaaaaaa);

    const { w, h } = calcScreenSizes();

    const camera = new THREE.PerspectiveCamera(
      getFovRange().max,
      w / h,
      0.1,
      1000
    );
    camera.position.set(0, cubeSize * 12, cubeSize * 10);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });

    renderer.setSize(w, h, false);

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.4;
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;

    if (oldSceneData) {
      controls.target.copy(oldSceneData.controls.target.clone());
      camera.position.copy(oldSceneData.camera.position.clone());
      camera.quaternion.copy(oldSceneData.camera.quaternion.clone());
      camera.fov = oldSceneData.camera.fov;
      camera.updateProjectionMatrix();
    }

    controls.update();

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);
    scene.add(trayMesh);

    return {
      ...result,
      scene,
      renderer,
      camera,
      cubesGroup,
      controls,
    };
  }

  return result;
}

export function moveBodyTowards(
  posV: Vector3,
  targetV: Vector3,
  step = 0.1,
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
  const angleVelocity = v.map((item) => item * 8) as Vector3;
  const velocity = v.map(
    (item) => item * 0.5 + Math.sign(item) * 0.5
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
  // .normalize();

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
  return JSON.stringify(a) === JSON.stringify(b);
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
    camera.fov += sign * 0.03;
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
