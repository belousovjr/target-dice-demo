import { RefObject, useEffect, useState } from "react";
import SceneProvider from "../SceneProvider";
import { FaceIndex } from "../types";

export default function useSceneProvider(
  canvas: RefObject<HTMLCanvasElement | null>
) {
  const [provider, setProvider] = useState<SceneProvider>();
  const [targetValues, setTargetValues] = useState<FaceIndex[]>([]);

  useEffect(() => {
    if (!provider && canvas.current) {
      setProvider(
        new SceneProvider(canvas.current, [4, 2], ({ targetValues }) => {
          setTargetValues(targetValues);
        })
      );
    }
  }, [canvas, provider]);

  return {
    provider,
    targetValues,
    setTargetValues: (value: FaceIndex[]) => {
      provider?.setData({ targetValues: value });
    },
  };
}
