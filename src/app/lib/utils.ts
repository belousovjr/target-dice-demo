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
  displayHeight,
  displayWidth,
  faceVectors,
  loadingRotateStep,
  restConfirmations,
} from "./constants";
import {
  BufferGeometryUtils,
  GLTFLoader,
  OrbitControls,
} from "three/examples/jsm/Addons.js";

const loader = new GLTFLoader();

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

const groundMaterial = new CANNON.Material("ground");

const diceMaterial = new CANNON.Material("dice");

const diceGroundContact = new CANNON.ContactMaterial(
  diceMaterial,
  groundMaterial,
  {
    friction: 0.3,
    restitution: 0.2,
  }
);

const boxShape = new CANNON.Box(
  new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2)
);

function createTray() {
  const sizes = new THREE.Vector3(25, 4, 20);
  const width = 0.5;
  const chamfer = width * 8;

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
      color: 0x0000ff,
      // transparent: true,
      // opacity: 0.5,
    })
  );

  const body = new CANNON.Body({
    mass: 0,
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

function checkIsMesh(obj: THREE.Object3D): obj is THREE.Mesh {
  return (obj as THREE.Mesh).isMesh;
}

export function createScene<
  T extends HTMLCanvasElement | null,
  S = T extends null ? SceneData : SceneDataForRender,
  C = T extends null ? CubeData : CubeDataForRender
>(cubesQty: number, canvas: T): S {
  const world = new CANNON.World();
  world.gravity.set(0, 0, 0);

  world.addContactMaterial(diceGroundContact);

  const scene = !!canvas && new THREE.Scene();

  const cubesGroup = !!canvas && new THREE.Group();
  if (scene && cubesGroup) {
    scene.add(cubesGroup);
  }

  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(50, 0.5, 50)),
    position: new CANNON.Vec3(0, -0.5, 0),
    material: groundMaterial,
  });
  world.addBody(groundBody);

  const cubes: C[] = [];

  for (let i = 0; i < cubesQty; i++) {
    const cubePosition = calcCubePosition(cubesQty, i);

    const cubeData = createCube(cubePosition, !!canvas);
    cubes.push(cubeData as C);

    world.addBody(cubeData.body);

    if (cubesGroup) {
      cubesGroup.add((cubeData as CubeDataForRender).mesh!);
    }
  }

  const result = {
    world,
    cubes,
  };

  if (scene) {
    scene.background = new THREE.Color(0xaaaaaa);

    const camera = new THREE.PerspectiveCamera(
      85,
      displayWidth / displayHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 30);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });

    renderer.setSize(displayWidth, displayHeight, false);

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(0, 0, 0);
    controls.update();

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    const groundGeo = new THREE.BoxGeometry(100, 1, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);

    groundMesh.position.copy(groundBody.position);
    scene.add(groundMesh);

    const { mesh: trayMesh, body: trayBody } = createTray();
    scene.add(trayMesh);
    world.addBody(trayBody);

    return {
      ...result,
      scene,
      renderer,
      camera,
      cubesGroup,
      controls,
    } as S;
  }

  return result as S;
}

export function lookAtCamera(
  camera: THREE.Camera,
  target: THREE.Object3D,
  lookTarget: THREE.Vector3
) {
  const box = new THREE.Box3().setFromObject(target);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const targetCenter = new THREE.Vector3(0, center.y, 0);

  lookTarget.lerp(targetCenter, 0.1);

  camera.lookAt(lookTarget);
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
  threshold = 0.001,
  step = 0.05
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
  const velocity = v.map((item) => item * 1) as Vector3;
  velocity[1] += 20;
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
  return () => {
    const sumVelocity = sceneData.cubes.reduce(
      (res, { body }) =>
        res + body.velocity.length() + body.angularVelocity.length(),
      0
    );

    if (sumVelocity / sceneData.cubes.length < 0.01) {
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
