"use client";

import { useRef } from "react";
import useSceneProvider from "../lib/helpers/useSceneProvider";

export default function Scene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { provider } = useSceneProvider(canvas);

  console.log(provider);

  return (
    <div>
      <center>
        <canvas ref={canvas} />
      </center>
    </div>
  );
}
