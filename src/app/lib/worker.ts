import { makeSimulation } from "./simulation";
import { RollReadyState } from "./types";

self.onmessage = function (
  event: MessageEvent<{
    states: RollReadyState[];
  }>
) {
  const { states } = event.data;

  makeSimulation(states, (value) => {
    self.postMessage({ facesData: value });
  });
};
