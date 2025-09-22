import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import SceneProvider from "../SceneProvider";
import { FaceIndex, ProviderStage, SceneAssets } from "../../types";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setTargetValues } from "@/app/store/slices/diceSlice";
import { loadAssets } from "../utils";

export default function useSceneProvider(
  canvas: RefObject<HTMLCanvasElement | null>
) {
  const targetValues = useAppSelector((state) => state.dice.targetValues);
  const appDispatch = useAppDispatch();
  const [stage, setStage] = useState<ProviderStage | "START">("START");
  const assets = useRef<SceneAssets>(null);
  const provider = useRef<SceneProvider>(null);
  const isLoading = useRef(false);

  const initProvider = useCallback(async () => {
    if (canvas.current) {
      isLoading.current = true;
      if (!assets.current) {
        assets.current = await loadAssets(canvas.current);
      }
      provider.current = new SceneProvider(
        assets.current,
        targetValues,
        (data) => {
          const newStage: ProviderStage = data.isFinal
            ? "FINAL"
            : data.isAnimation
            ? "ANIMATION"
            : data.isLoading
            ? "LOADING"
            : "CONFIG";

          setStage(newStage);
          appDispatch(setTargetValues(data.targetValues));
        }
      );
      isLoading.current = false;
    }
  }, [appDispatch, canvas, targetValues]);

  useEffect(() => {
    if (!provider.current && !isLoading.current) {
      initProvider();
    }
  }, [initProvider]);

  useEffect(() => {
    const resizeHandler = () => {
      provider.current?.syncSizes();
    };

    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return {
    targetValues,
    stage,
    setTargetValues: (value: FaceIndex[]) => {
      provider.current?.setData({ targetValues: value });
    },
    start: () => {
      provider.current?.start();
    },
    reset: () => {
      provider.current?.reset();
    },
  };
}
