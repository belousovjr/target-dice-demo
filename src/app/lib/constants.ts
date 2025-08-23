import * as THREE from "three";
import { Quaternion, SceneProviderData } from "./types";

export const faceVectors = {
  1: new THREE.Vector3(0, 1, 0), //top
  2: new THREE.Vector3(0, 0, -1), //back
  3: new THREE.Vector3(1, 0, 0), //right
  4: new THREE.Vector3(-1, 0, 0), //left
  5: new THREE.Vector3(0, 0, 1), //front
  6: new THREE.Vector3(0, -1, 0), //bottom
} as const;

export const cubeMaterialsNumbers = [
  3, // right
  4, // left
  1, // top
  6, // bottom
  5, // front
  2, // back
];

export const cubeSize = 1;
export const cubeOffset = cubeSize * 2;
export const cubeDefaultY = 5;

export const defaultCubeRotateQ: Quaternion = [
  0.3535533905932738, 0.3535533905932738, 0.14644660940672624,
  0.8535533905932737,
];

export const initialSceneProviderData: SceneProviderData = {
  targetValues: [],
  isLoading: false,
};

export const loadingRotateStep = Math.PI / 18;
