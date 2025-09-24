"use client";

import { useEffect, useRef } from "react";
import useSceneProvider from "../lib/helpers/useSceneProvider";
import { FaceIndex } from "../types";
import { Button, Loader, Textfield } from "@belousovjr/uikit";
import { PlusIcon, PlayIcon, RotateCcwIcon, XIcon } from "lucide-react";
import useServiceContext from "../lib/helpers/useServiceContext";
import Snackbar from "./Snackbar";
import TutorialTip from "./TutorialTip";
import useTutorial from "../lib/helpers/useTutorial";

export default function SceneView() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const { targetValues, stage, setTargetValues, start, reset } =
    useSceneProvider(canvas);

  const { setNotification } = useServiceContext();
  const { checkStatus, lastActiveStatus } = useTutorial();

  useEffect(() => {
    if (stage === "FINAL") {
      resetRef.current?.focus();
      checkStatus("RESET");
    } else if (stage === "CONFIG") {
      checkStatus("CONFIG");
    }
  }, [checkStatus, stage]);

  return (
    <>
      <div className="fixed z-10 w-full">
        <div className="flex pt-3.5 px-2 md:px-8 items-start justify-between mx-auto w-full max-w-[1920px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-9 h-9 p-1.5 text-white rounded-full bg-general-60 shrink-0 grow-0"
          >
            <path d="m16 16 2 2 4-4" />
            <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" x2="12" y1="22" y2="12" />
          </svg>
          {stage !== "START" && (
            <div className="flex items-start justify-end gap-0.5 md:gap-1">
              <TutorialTip status="CONFIG" disabled={stage !== "CONFIG"}>
                <div className="flex items-start gap-0.5 md:gap-1">
                  {targetValues.map((item, i) => (
                    <div key={i}>
                      <Textfield
                        value={item}
                        key={`input-${i}`}
                        onChange={(e) => {
                          (e.target as HTMLInputElement).setSelectionRange(
                            0,
                            1
                          );
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key.length === 1 &&
                            !e.ctrlKey &&
                            !e.shiftKey &&
                            !e.altKey
                          ) {
                            const value = Number(e.key) as FaceIndex;
                            if (!isNaN(value) && value > 0 && value <= 6) {
                              const newTargetValues = [...targetValues];
                              newTargetValues[i] = value;
                              setTargetValues(newTargetValues);
                              checkStatus("ROLL");
                            } else {
                              setNotification?.({
                                text: "Only numbers from 1 to 6 are allowed",
                                variant: "alert",
                              });
                            }
                          }
                        }}
                        className="text-center w-9 px-0"
                        disabled={stage !== "CONFIG"}
                        size="sm"
                        onFocus={(e) => e.target.select()}
                        inputMode="decimal"
                      />
                      {stage === "CONFIG" && targetValues.length > 1 && (
                        <Button
                          onClick={() => {
                            const newTargetValues = [...targetValues];
                            newTargetValues.splice(i, 1);
                            setTargetValues(newTargetValues);
                            checkStatus("ROLL");
                          }}
                          icon={<XIcon />}
                          variant="destructiveSecondary"
                          size="sm"
                          className="bg-transparent"
                        />
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={() => {
                      setTargetValues([...targetValues, 1]);
                      checkStatus("ROLL");
                    }}
                    icon={<PlusIcon />}
                    size="sm"
                    disabled={stage !== "CONFIG" || targetValues.length >= 6}
                    variant="secondary"
                  />
                </div>
              </TutorialTip>
              {stage === "CONFIG" ? (
                <TutorialTip
                  status="ROLL"
                  disabled={lastActiveStatus !== "ROLL"}
                  hidden={lastActiveStatus === "FINAL"}
                >
                  <Button
                    onClick={() => {
                      start();
                    }}
                    icon={<PlayIcon />}
                    size="sm"
                  />
                </TutorialTip>
              ) : (
                <TutorialTip
                  status="RESET"
                  disabled={!(lastActiveStatus === "RESET")}
                  hidden={stage !== "FINAL"}
                >
                  <Button
                    ref={resetRef}
                    onClick={() => {
                      reset();
                      checkStatus("FINAL");
                    }}
                    icon={<RotateCcwIcon />}
                    size="sm"
                  />
                </TutorialTip>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="fixed left-0 top-0 w-full h-dvh bg-gradient-to-b from-general-60/50 to-general-60">
        {stage === "START" && (
          <Loader className="fixed left-1/2 top-1/2 -translate-1/2 text-white" />
        )}
        <canvas ref={canvas} className="w-full h-full" />
      </div>

      <Snackbar />
    </>
  );
}
