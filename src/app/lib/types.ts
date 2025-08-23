import CANNON from "cannon";
import * as THREE from "three";
import { faceVectors } from "./constants";

export type FaceIndex = keyof typeof faceVectors;

export interface FaceIndexData {
  face: FaceIndex;
  index: number;
}

export interface CubeData {
  body: CANNON.Body;
}

export interface CubeDataForRender extends CubeData {
  mesh: THREE.Mesh;
}

export interface SceneData {
  world: CANNON.World;
  cubes: CubeData[];
}

export interface SceneDataForRender extends SceneData {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  cubes: CubeDataForRender[];
  cubesGroup: THREE.Group;
}

export type Vector3 = [number, number, number];
export type Quaternion = [number, number, number, number];
