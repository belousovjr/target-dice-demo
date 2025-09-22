"use client";

import { useRef } from "react";
import useSceneProvider from "../lib/helpers/useSceneProvider";
import { FaceIndex } from "../lib/types";
import { Button, Loader, Textfield } from "@belousovjr/uikit";
import { PlusIcon, PlayIcon, RotateCcwIcon, XIcon } from "lucide-react";

export default function SceneView() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { provider, targetValues, stage, setTargetValues, start, reset } =
    useSceneProvider(canvas);

  return (
    <>
      {provider && (
        <div className="fixed z-10 flex gap-2">
          {stage !== "CONFIG" && (
            <Button onClick={reset} icon={<RotateCcwIcon />} />
          )}
          {targetValues.map((item, i) => (
            <div key={i} className="grid gap-1">
              <Textfield
                value={item}
                onChange={(e) => {
                  const value = Number(e.target.value) as FaceIndex;
                  const newTargetValues = [...targetValues];
                  newTargetValues[i] = value;
                  setTargetValues(newTargetValues);
                }}
                className="text-center w-10 px-0"
                disabled={stage !== "CONFIG"}
              />
              {stage === "CONFIG" && targetValues.length > 1 && (
                <Button
                  onClick={() => {
                    const newTargetValues = [...targetValues];
                    newTargetValues.splice(i, 1);
                    setTargetValues(newTargetValues);
                  }}
                  icon={<XIcon />}
                  variant="destructive"
                />
              )}
            </div>
          ))}
          {stage === "CONFIG" && (
            <>
              <Button
                onClick={() => {
                  setTargetValues([...targetValues, 1]);
                }}
                icon={<PlusIcon />}
              />
              <Button onClick={start} icon={<PlayIcon />} />
            </>
          )}
        </div>
      )}
      <div className="fixed left-0 top-0 w-full h-full bg-gradient-to-b from-general-60/50 to-general-60">
        {!provider && (
          <Loader className="fixed left-1/2 top-1/2 -translate-1/2 text-white" />
        )}
      </div>

      <canvas
        ref={canvas}
        className="fixed top-0 left-0 w-dvw max-h-dvh object-contain"
      />
    </>
  );
}
