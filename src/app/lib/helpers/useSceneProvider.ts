import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import SceneProvider from "../SceneProvider";
import { FaceIndex, ProviderStage, SceneTextures } from "../types";
import { loadTextures } from "../utils";

export default function useSceneProvider(
  canvas: RefObject<HTMLCanvasElement | null>
) {
  const [provider, setProvider] = useState<SceneProvider>();
  const [targetValues, setTargetValues] = useState<FaceIndex[]>([]);
  const [stage, setStage] = useState<ProviderStage>("CONFIG");
  const textures = useRef<SceneTextures>(null);

  const initProvider = useCallback(async () => {
    if (canvas.current) {
      if (!textures.current) {
        textures.current = await loadTextures();
      }
      setProvider(
        new SceneProvider(
          canvas.current,
          textures.current,
          [6, 6, 6, 6, 6, 6],
          ({ isLoading, isAnimation, isFinal, targetValues }) => {
            const newStage: ProviderStage = isFinal
              ? "FINAL"
              : isAnimation
              ? "ANIMATION"
              : isLoading
              ? "LOADING"
              : "CONFIG";

            setStage(newStage);
            setTargetValues(targetValues);
          }
        )
      );
    }
  }, [canvas]);

  useEffect(() => {
    if (!provider) {
      initProvider();
    }
  }, [provider, initProvider]);

  useEffect(() => {
    const resizeHandler = () => {
      provider?.syncSizes();
    };

    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [provider]);

  return {
    provider,
    targetValues,
    stage,
    setTargetValues: (value: FaceIndex[]) => {
      provider?.setData({ targetValues: value });
    },
    start: () => {
      provider?.start();
    },
    reset: () => {
      provider?.reset();
    },
  };
}
