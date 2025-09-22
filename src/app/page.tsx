import dynamic from "next/dynamic";
const SceneView = dynamic(() => import("./components/SceneView"));

export default function Home() {
  return <SceneView />;
}
