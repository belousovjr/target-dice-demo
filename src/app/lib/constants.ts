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

export const cubeSize = 0.7;
export const cubeOffset = cubeSize * 2;
export const cubeDefaultY = cubeSize * 4;

export const defaultCubeRotateQ: Quaternion = [
  0.3535533905932738, 0.3535533905932738, 0.14644660940672624,
  0.8535533905932737,
];

export const initialSceneProviderData: SceneProviderData = {
  targetValues: [],
  facesData: [],
  isLoading: false,
  isAnimation: false,
  isFinal: false,
};

export const loadingRotateStep = Math.PI / 20;

export const restConfirmations = 50;
export const stepsConfirmations = 500;

export const gravitationValue = -9.82;

export const maxDisplayWidth = 2048;

export const minDistance = cubeSize * 10;
export const maxDistance = cubeSize * 16;

export const traySizes = new THREE.Vector3(
  cubeSize * 22,
  cubeSize * 4.5,
  cubeSize * 12
);
