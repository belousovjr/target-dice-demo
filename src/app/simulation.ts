import CANNON from "cannon";
import { FaceIndex, FaceIndexData, RollReadyState } from "./types";
import { applyRollReadyStates, createScene, getRestChecker } from "./lib/utils";
import { faceVectors, gravitationValue } from "./lib/constants";

export function getTopFaceIndex(quaternion: CANNON.Quaternion) {
  const up = new CANNON.Vec3(0, 1, 0);
  let topFace: FaceIndex;
  let maxDot = -Infinity;

  for (const [face, localNormal] of Object.entries(faceVectors)) {
    const worldNormal = localNormal.clone().applyQuaternion(quaternion);
    const dot = worldNormal.dot(up);

    if (dot > maxDot) {
      maxDot = dot;
      topFace = Number(face) as FaceIndex;
    }
  }

  return topFace!;
}

export function makeSimulation(
  rollReadyStates: RollReadyState[],
  callback: (faces: FaceIndexData[]) => void
) {
  const sceneData = createScene(rollReadyStates.length, null);
  sceneData.world.gravity.set(0, gravitationValue, 0);

  applyRollReadyStates(sceneData, rollReadyStates);

  let isFinal = false;

  const checkRest = getRestChecker(sceneData);

  function animate() {
    sceneData.world.step(1 / 60);

    if (checkRest()) {
      callback(
        sceneData.cubes
          .map(({ body }, index) => ({ body, index }))
          .toSorted(
            ({ body: { position: posA } }, { body: { position: posB } }) =>
              posA.x - posB.x || posA.y - posB.y
          )
          .map(({ body, index }) => ({
            face: getTopFaceIndex(body.quaternion),
            index,
          }))
      );
      isFinal = true;
    }
  }

  while (!isFinal) {
    animate();
  }
}
