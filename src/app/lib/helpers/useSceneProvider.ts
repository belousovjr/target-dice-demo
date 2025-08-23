import { RefObject, useEffect, useState } from "react";
import SceneProvider from "../SceneProvider";
import { FaceIndex, ProviderStage } from "../types";

export default function useSceneProvider(
  canvas: RefObject<HTMLCanvasElement | null>
) {
  const [provider, setProvider] = useState<SceneProvider>();
  const [targetValues, setTargetValues] = useState<FaceIndex[]>([]);
  const [stage, setStage] = useState<ProviderStage>("CONFIG");

  useEffect(() => {
    if (!provider && canvas.current) {
      setProvider(
        new SceneProvider(
          canvas.current,
          [4, 2],
          ({ isLoading, targetValues }) => {
            const newStage: ProviderStage = isLoading ? "LOADING" : "CONFIG";

            setStage(newStage);
            setTargetValues(targetValues);
          }
        )
      );
    }
  }, [canvas, provider]);

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
  };
}
