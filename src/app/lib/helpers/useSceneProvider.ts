import { RefObject, useEffect, useState } from "react";
import SceneProvider from "../SceneProvider";

export default function useSceneProvider(
  canvas: RefObject<HTMLCanvasElement | null>
) {
  const [provider, setProvider] = useState<SceneProvider>();

  useEffect(() => {
    if (!provider && canvas.current) {
      setProvider(new SceneProvider(canvas.current, [4, 2]));
    }
  }, [canvas, provider]);

  return {
    provider,
  };
}
