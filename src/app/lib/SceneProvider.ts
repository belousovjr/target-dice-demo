import * as THREE from "three";
import { FaceIndex, SceneDataForRender } from "./types";
import { createScene, lookAtCamera, syncMesh } from "./utils";

export default class SceneProvider {
  sceneData: SceneDataForRender;
  canvas: HTMLCanvasElement;
  lookTarget = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement, targetValues: FaceIndex[]) {
    this.canvas = canvas;

    this.sceneData = createScene(targetValues.length, canvas);

    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const { world, scene, camera, renderer, cubes, cubesGroup } =
      this.sceneData;
    world.step(1 / 60);

    for (let i = 0; i < cubes.length; i++) {
      const cubeData = cubes[i];
      syncMesh(cubeData);
    }

    lookAtCamera(camera, cubesGroup, this.lookTarget);

    renderer.render(scene, camera);
  }
}
