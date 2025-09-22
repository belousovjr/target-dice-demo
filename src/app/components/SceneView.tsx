"use client";

import { useEffect, useRef } from "react";
import useSceneProvider from "../lib/helpers/useSceneProvider";
import { FaceIndex } from "../types";
import { Button, Loader, Textfield } from "@belousovjr/uikit";
import { PlusIcon, PlayIcon, RotateCcwIcon, XIcon } from "lucide-react";
import useServiceContext from "../lib/helpers/useServiceContext";
import Snackbar from "./Snackbar";

export default function SceneView() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const { targetValues, stage, setTargetValues, start, reset } =
    useSceneProvider(canvas);

  const { setNotification } = useServiceContext();

  useEffect(() => {
    if (stage === "FINAL") {
      resetRef.current?.focus();
    }
  }, [stage]);

  return (
    <>
      {stage !== "START" && (
        <div className="fixed flex justify-center z-10 w-full pointer-events-none">
          <div className="ml-auto lg:mr-auto px-1 pt-1 flex items-start justify-end gap-1 w-85 pointer-events-auto">
            {targetValues.map((item, i) => (
              <div key={i}>
                <Textfield
                  value={item}
                  key={`input-${i}`}
                  onChange={(e) => {
                    (e.target as HTMLInputElement).select();

                    (e.target as HTMLInputElement).setSelectionRange(0, 1);
                  }}
                  onKeyDown={(e) => {
                    const value = Number(e.key) as FaceIndex;
                    if (!isNaN(value) && value > 0 && value <= 6) {
                      const newTargetValues = [...targetValues];
                      newTargetValues[i] = value;
                      setTargetValues(newTargetValues);
                    } else {
                      setNotification?.({
                        text: "Only numbers from 1 to 6 are allowed",
                        variant: "alert",
                      });
                    }
                  }}
                  className="text-center w-9 px-0"
                  disabled={stage !== "CONFIG"}
                  size="sm"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                />
                {stage === "CONFIG" && targetValues.length > 1 && (
                  <Button
                    onClick={() => {
                      const newTargetValues = [...targetValues];
                      newTargetValues.splice(i, 1);
                      setTargetValues(newTargetValues);
                    }}
                    icon={<XIcon />}
                    variant="destructiveSecondary"
                    size="sm"
                    className="bg-transparent"
                  />
                )}
              </div>
            ))}
            {targetValues.length < 6 && (
              <Button
                onClick={() => {
                  setTargetValues([...targetValues, 1]);
                }}
                icon={<PlusIcon />}
                size="sm"
                disabled={stage !== "CONFIG"}
              />
            )}
            {stage === "CONFIG" ? (
              <Button onClick={start} icon={<PlayIcon />} size="sm" />
            ) : (
              <Button
                ref={resetRef}
                onClick={reset}
                icon={<RotateCcwIcon />}
                size="sm"
              />
            )}
          </div>
        </div>
      )}
      <div className="fixed left-0 top-0 w-full h-full bg-gradient-to-b from-general-60/50 to-general-60">
        {stage === "START" && (
          <Loader className="fixed left-1/2 top-1/2 -translate-1/2 text-white" />
        )}
      </div>

      <canvas
        ref={canvas}
        className="fixed top-0 left-0 w-dvw max-h-dvh object-contain"
      />
      <Snackbar />
    </>
  );
}
