import CANNON from "cannon";
import * as THREE from "three";
import { faceVectors, tutorialStatuses } from "./lib/constants";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { ComponentProps } from "react";
import { Notification } from "@belousovjr/uikit";

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
  tray: {
    body: CANNON.Body;
  };
}

export interface SceneDataForRender extends SceneData {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  cubes: CubeDataForRender[];
  cubesGroup: THREE.Group;
  controls: OrbitControls;
  tray: {
    body: CANNON.Body;
    mesh: THREE.Mesh;
  };
}

export type Vector3 = [number, number, number];
export type Quaternion = [number, number, number, number];

export interface CubeTargetState {
  position: Vector3;
  rotate: Quaternion;
}
export interface SceneProviderData {
  targetValues: FaceIndex[];
  facesData: FaceIndexData[];
  isLoading: boolean;
  isAnimation: boolean;
  isFinal: boolean;
}

export type SceneProviderDataUpdate = {
  [K in keyof SceneProviderData]?: SceneProviderData[K];
};

export interface RollReadyState {
  velocity: Vector3;
  angleVelocity: Vector3;
  rotate: Quaternion;
}

export interface FaceRotationData {
  target: THREE.Quaternion;
  current: THREE.Quaternion;
}

export type ProviderStage = "CONFIG" | "LOADING" | "ANIMATION" | "FINAL";

export interface SceneAssets {
  tray: THREE.Mesh;
  dice: THREE.Mesh;
  renderer: THREE.WebGLRenderer;
}

export interface SnackbarData {
  text: string;
  variant?: ComponentProps<typeof Notification>["variant"];
  timestamp: number;
}

export type TutorialStatusOption = (typeof tutorialStatuses)[number];

export type TutorialStatusState = Record<TutorialStatusOption, boolean>;
