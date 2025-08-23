import CANNON from "cannon";
import * as THREE from "three";
import {
  CubeData,
  CubeDataForRender,
  SceneData,
  SceneDataForRender,
  Vector3,
} from "./types";
import {
  cubeDefaultY,
  cubeMaterialsNumbers,
  cubeOffset,
  cubeSize,
} from "./constants";

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

export function createCube<
  T extends boolean,
  R = T extends true ? CubeDataForRender : CubeData
>(position: Vector3, withMesh: T): R {
  const diceMaterial = new CANNON.Material("dice");
  diceMaterial.friction = 0.4;
  diceMaterial.restitution = 0.25;

  const body = new CANNON.Body({
    mass: 0.005,
    shape: new CANNON.Box(
      new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2)
    ),
    position: new CANNON.Vec3(...position),
    material: diceMaterial,
  });
  body.linearDamping = 0.08;
  body.angularDamping = 0.12;

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

export function createScene<
  T extends HTMLCanvasElement | null,
  S = T extends null ? SceneData : SceneDataForRender,
  C = T extends null ? CubeData : CubeDataForRender
>(cubesQty: number, canvas: T): S {
  const world = new CANNON.World();
  world.gravity.set(0, 0, 0);

  const scene = !!canvas && new THREE.Scene();

  const cubesGroup = !!canvas && new THREE.Group();
  if (scene && cubesGroup) {
    scene.add(cubesGroup);
  }

  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(50, 0.5, 50)),
    position: new CANNON.Vec3(0, -0.5, 0),
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

    const camera = new THREE.PerspectiveCamera(85, 800 / 600, 0.1, 1000);
    camera.position.set(0, 10, 8);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });

    renderer.setSize(800, 600);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    const groundGeo = new THREE.BoxGeometry(100, 1, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x007700,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);

    groundMesh.position.copy(groundBody.position);
    scene.add(groundMesh);

    return {
      ...result,
      scene,
      renderer,
      camera,
      cubesGroup,
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
