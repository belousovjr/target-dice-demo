import * as THREE from "three";
import {
  CubeTargetState,
  FaceIndex,
  Quaternion,
  RollReadyState,
  SceneDataForRender,
  SceneProviderData,
  SceneProviderDataUpdate,
  Vector3,
} from "./types";
import {
  calcCubePosition,
  calcLoadingStep,
  createCube,
  createScene,
  genRollReadyState,
  lookAtCamera,
  moveBodyTowards,
  rotateBodyTowards,
  syncMesh,
} from "./utils";
import {
  cubeDefaultY,
  cubeOffset,
  defaultCubeRotateQ,
  initialSceneProviderData,
} from "./constants";

export default class SceneProvider {
  sceneData: SceneDataForRender;
  data: SceneProviderData;
  updateCallback: (value: SceneProviderData) => void;
  canvas: HTMLCanvasElement;
  lookTarget = new THREE.Vector3();

  targetStates: CubeTargetState[] = [];
  rollReadyStates: RollReadyState[] = [];
  loadingMeshesStates: THREE.Quaternion[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    targetValues: FaceIndex[],
    callback: (value: SceneProviderData) => void
  ) {
    this.canvas = canvas;
    this.data = {
      ...{ ...initialSceneProviderData, targetValues },
    };
    this.updateCallback = callback;
    this.updateCallback(this.data);

    this.sceneData = createScene(targetValues.length, canvas);

    this.syncTargetValuesWithScene();

    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const { world, scene, camera, renderer, cubes, cubesGroup } =
      this.sceneData;
    world.step(1 / 60);

    let doneStatesQty = 0;
    let isLoadingStart = false;

    for (let i = 0; i < cubes.length; i++) {
      const cubeData = cubes[i];
      const targetState = this.targetStates[i];
      const loadingQuant = this.loadingMeshesStates[i];
      const rollReadyState = this.rollReadyStates[i];

      if (targetState) {
        const { vector, isDone: isMoveDone } = moveBodyTowards(
          cubeData.body.position.toArray() as Vector3,
          targetState.position
        );
        cubeData.body.position.set(...vector);

        const { quant, isDone: isRotateDone } = rotateBodyTowards(
          cubeData.body.quaternion.toArray() as Quaternion,
          targetState.rotate
        );
        cubeData.body.quaternion.set(...quant);

        if (isMoveDone && isRotateDone) {
          doneStatesQty++;
        }
      } else {
        doneStatesQty++;
      }

      syncMesh(cubeData);

      if (!isLoadingStart && loadingQuant && rollReadyState) {
        const { quant, isStartPosition } = calcLoadingStep(
          loadingQuant,
          rollReadyState.angleVelocity
        );

        loadingQuant.copy(quant);
        if (!isStartPosition) {
          cubeData.mesh.quaternion.premultiply(loadingQuant);
        } else {
          isLoadingStart = true;
          this.loadingMeshesStates = this.loadingMeshesStates.map(
            () => new THREE.Quaternion()
          );
        }
      }
    }

    if (doneStatesQty === this.targetStates.length) {
      this.targetStates = [];
    }

    lookAtCamera(camera, cubesGroup, this.lookTarget);

    renderer.render(scene, camera);
  }

  setData(value: SceneProviderDataUpdate) {
    const targetValuesUpdatedLength =
      value.targetValues &&
      value.targetValues.length !== this.data.targetValues.length;

    this.data = { ...this.data, ...value };
    this.updateCallback(this.data);

    if (targetValuesUpdatedLength) {
      this.syncTargetValuesWithScene();
    }
  }
  syncTargetValuesWithScene() {
    const cubesQty = this.data.targetValues.length;
    const newTargetStates: CubeTargetState[] = [];
    const newRollReadyStates: RollReadyState[] = [];

    const { world, cubesGroup } = this.sceneData;

    const oldCubes = [...this.sceneData.cubes];
    this.sceneData.cubes = [];

    for (let i = oldCubes.length; i > cubesQty; i--) {
      const oldCubeData = oldCubes[i - 1];
      world.remove(oldCubeData.body);
      cubesGroup.remove(oldCubeData.mesh);
    }

    for (let i = 0; i < cubesQty; i++) {
      const oldCubeData = oldCubes[i];
      const targetPosition = calcCubePosition(cubesQty, i);

      let body: CANNON.Body;
      let mesh: THREE.Mesh;

      if (oldCubeData) {
        body = oldCubeData.body;
        mesh = oldCubeData.mesh;
      } else {
        const prevCubeBody = oldCubes[i - 1]?.body;
        const coordX = prevCubeBody
          ? prevCubeBody.position.x + cubeOffset
          : targetPosition[0];

        const newCubeData = createCube([coordX, cubeDefaultY, 0], true);
        body = newCubeData.body;
        mesh = newCubeData.mesh;
      }

      newTargetStates.push({
        position: targetPosition,
        rotate: defaultCubeRotateQ,
      });
      newRollReadyStates.push(genRollReadyState());

      world.addBody(body);
      cubesGroup.add(mesh);

      this.sceneData.cubes.push({ body, mesh });
    }

    this.targetStates = newTargetStates;
    this.rollReadyStates = newRollReadyStates;
  }
  start() {
    this.loadingMeshesStates = this.sceneData.cubes.map(
      () => new THREE.Quaternion()
    );
    this.targetStates = this.rollReadyStates.map((item, i, arr) => ({
      rotate: item.rotate,
      position: calcCubePosition(arr.length, i),
    }));
    this.setData({
      isLoading: true,
    });
  }
}
