"use client";

import { useRef } from "react";
import useSceneProvider from "../lib/helpers/useSceneProvider";
import { FaceIndex } from "../lib/types";

export default function Scene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { targetValues, setTargetValues } = useSceneProvider(canvas);

  return (
    <div>
      <button
        onClick={() => {
          setTargetValues([...targetValues, 1]);
        }}
      >
        ADD
      </button>
      {targetValues.map((item, i) => (
        <label key={i}>
          {i}:
          <input
            type="number"
            value={item}
            onChange={(e) => {
              const value = Number(e.target.value) as FaceIndex;
              const newTargetValues = [...targetValues];
              newTargetValues[i] = value;
              setTargetValues(newTargetValues);
            }}
            min="1"
            max="6"
            className="bg-white text-black w-[40px]"
          />
          {targetValues.length > 1 && (
            <button
              onClick={() => {
                const newTargetValues = [...targetValues];
                newTargetValues.splice(i, 1);
                setTargetValues(newTargetValues);
              }}
            >
              x
            </button>
          )}
        </label>
      ))}
      <center>
        <canvas ref={canvas} />
      </center>
    </div>
  );
}
