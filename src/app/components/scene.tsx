"use client";

import { useRef } from "react";
import useSceneProvider from "../lib/helpers/useSceneProvider";
import { FaceIndex } from "../lib/types";

export default function Scene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { provider, targetValues, stage, setTargetValues, start, reset } =
    useSceneProvider(canvas);

  return (
    <div>
      {provider && (
        <>
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
          {stage === "FINAL" && <button onClick={reset}>RESET</button>}{" "}
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
        </>
      )}
      <center>
        <canvas
          ref={canvas}
          className="max-w-full max-h-[100dvh] object-contain"
        />
      </center>
    </div>
  );
}
