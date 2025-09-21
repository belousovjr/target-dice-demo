import * as THREE from "three";
import {
  CubeTargetState,
  FaceIndex,
  FaceIndexData,
  FaceRotationData,
  Quaternion,
  RollReadyState,
  SceneDataForRender,
  SceneProviderData,
  SceneProviderDataUpdate,
  Vector3,
} from "./types";
import {
  applyRollReadyStates,
  calcCubePosition,
  calcLoadingStep,
  compareArrays,
  createCube,
  createScene,
  genRollReadyState,
  getFaceRotationQuant,
  getRestChecker,
  moveBodyTowards,
  rotateBodyTowards,
  syncMesh,
  calcTarget,
  calcFov,
  calcScreenSizes,
} from "./utils";
import {
  cubeDefaultY,
  cubeOffset,
  defaultCubeRotateQ,
  gravitationValue,
  initialSceneProviderData,
} from "./constants";

export default class SceneProvider {
  sceneData: SceneDataForRender;
  data: SceneProviderData;
  #updateCallback: (value: SceneProviderData) => void;
  canvas: HTMLCanvasElement;
  lookTarget = new THREE.Vector3();

  targetStates: CubeTargetState[] = [];
  rollReadyStates: RollReadyState[] = [];
  loadingMeshesStates: THREE.Quaternion[] = [];
  facesRotationData: FaceRotationData[] = [];

  worker: Worker | undefined;
  #restChecker: (() => boolean) | undefined;
  rollCalc = 0;

  constructor(
    canvas: HTMLCanvasElement,
    targetValues: FaceIndex[],
    callback: (value: SceneProviderData) => void
  ) {
    this.canvas = canvas;
    this.data = {
      ...{ ...initialSceneProviderData, targetValues },
    };
    this.#updateCallback = callback;
    this.#updateCallback(this.data);

    this.sceneData = createScene(targetValues.length, canvas);
    this.lookTarget = calcTarget(this.sceneData.cubesGroup);

    this.#syncTargetValuesWithScene();

    this.#animate();
  }

  #animate() {
    if (this.data.isAnimation) {
      this.rollCalc++;
    }
    requestAnimationFrame(this.#animate.bind(this));
    const { world, scene, camera, renderer, cubes, cubesGroup, controls } =
      this.sceneData;
    world.step(1 / 60);
    let doneStatesQty = 0;
    let doneFacesRotQty = 0;
    let isLoadingStart = false;

    for (let i = 0; i < cubes.length; i++) {
      const cubeData = cubes[i];
      const targetState = this.targetStates[i];
      const loadingQuant = this.loadingMeshesStates[i];
      const rollReadyState = this.rollReadyStates[i];
      const faceRotData = this.facesRotationData[i];

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
      if ((this.data.isLoading || this.data.isAnimation) && faceRotData) {
        const { quant, isDone } = rotateBodyTowards(
          faceRotData.current.toArray(),
          faceRotData.target.toArray()
        );
        if (isDone) {
          doneFacesRotQty++;
        }
        faceRotData.current = new THREE.Quaternion(...quant);

        cubeData.mesh.quaternion.multiply(faceRotData.current);
      }
    }

    if (
      this.targetStates.length &&
      doneStatesQty === this.targetStates.length
    ) {
      this.targetStates = [];
    }

    if (this.data.isLoading) {
      const isFacesTargetPos =
        this.facesRotationData.length &&
        doneFacesRotQty === this.facesRotationData.length;

      if (isFacesTargetPos && isLoadingStart && !this.targetStates.length) {
        this.#makeRoll();
      }

      calcFov(camera, -1);
    } else {
      calcFov(camera, 1);
    }

    if (this.data.isAnimation && this.#restChecker?.()) {
      this.setData({ isFinal: true });
    }

    this.lookTarget = calcTarget(cubesGroup, this.lookTarget);
    controls.target.copy(this.lookTarget);

    controls.update();

    renderer.render(scene, camera);
  }

  setData(value: SceneProviderDataUpdate) {
    const targetValuesUpdatedLength =
      value.isFinal === false ||
      (value.targetValues &&
        value.targetValues.length !== this.data.targetValues.length);
    const facesOrTargetsUpdated =
      (value.facesData &&
        !compareArrays(value.facesData, this.data.facesData)) ||
      (value.targetValues &&
        !compareArrays(value.targetValues, this.data.targetValues));

    this.data = { ...this.data, ...value };
    this.#updateCallback(this.data);

    if (targetValuesUpdatedLength) {
      this.#syncTargetValuesWithScene();
    }
    if (facesOrTargetsUpdated) {
      this.#syncFacesRotationData();
    }
  }
  #syncTargetValuesWithScene() {
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

    this.worker?.terminate();

    this.worker = new Worker(new URL("@/app/lib/worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (
      event: MessageEvent<{ facesData: FaceIndexData[] }>
    ) => {
      this.setData({ facesData: event.data.facesData });
    };
    this.worker.onerror = (e) => {
      e.preventDefault();
    };

    this.worker.postMessage({
      states: newRollReadyStates,
    });

    this.targetStates = newTargetStates;
    this.rollReadyStates = newRollReadyStates;
  }
  #syncFacesRotationData() {
    const { targetValues, facesData } = this.data;
    if (facesData.length && facesData.length === targetValues.length) {
      this.facesRotationData = facesData
        .map(({ face, index }, i) => ({
          target: getFaceRotationQuant(face, this.data.targetValues[i]),
          index,
        }))
        .toSorted((a, b) => a.index - b.index)
        .map(({ target }) => ({ target, current: new THREE.Quaternion() }));
    }
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
  #makeRoll() {
    this.loadingMeshesStates = [];
    this.targetStates = [];
    this.setData({ isLoading: false, isAnimation: true, facesData: [] });
    this.#restChecker = getRestChecker(this.sceneData);

    this.sceneData.world.gravity.set(0, gravitationValue, 0);
    applyRollReadyStates(this.sceneData, this.rollReadyStates);
  }
  reset() {
    this.targetStates = [];
    this.rollReadyStates = [];
    this.loadingMeshesStates = [];
    this.facesRotationData = [];
    this.#restChecker = undefined;
    this.worker = undefined;

    this.sceneData = createScene(
      this.data.targetValues.length,
      this.canvas,
      this.sceneData
    );
    this.sceneData.world.gravity.set(0, 0, 0);

    this.setData({
      ...initialSceneProviderData,
      targetValues: this.data.targetValues,
    });
  }
  syncSizes() {
    const { w, h } = calcScreenSizes();
    const { camera, renderer } = this.sceneData;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
}
