"use client";

import { useRef } from "react";
import useSceneProvider from "../lib/helpers/useSceneProvider";
import { FaceIndex } from "../lib/types";

export default function Scene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { provider, targetValues, stage, setTargetValues, start, reset } =
    useSceneProvider(canvas);

  return (
    <>
      {provider && (
        <div className="fixed z-10">
          {stage === "CONFIG" && (
            <>
              <button
                onClick={() => {
                  setTargetValues([...targetValues, 1]);
                }}
              >
                ADD
              </button>
              {" | "}
              <button onClick={start}>START</button>
            </>
          )}
          {stage !== "CONFIG" && <button onClick={reset}>RESET</button>}{" "}
          {targetValues.map((item, i) => (
            <label key={i}>
              {" "}
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
                disabled={stage !== "CONFIG"}
              />
              {stage === "CONFIG" && targetValues.length > 1 && (
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
        </div>
      )}
      <canvas
        ref={canvas}
        className="fixed top-0 left-0 w-dvw max-h-dvh object-contain"
      />
    </>
  );
}
