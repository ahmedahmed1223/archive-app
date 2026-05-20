export {
  runOperationPreflight,
  runStartupSequence
} from "../../runtime/videoArchiveRuntime.js";
export { STARTUP_SEQUENCE_STEP_DEFINITIONS } from "./startupSteps.js";

export function getSystemHealthActions(store) {
  return {
    runSystemHealthCheck: store?.runSystemHealthCheck,
    updateSettings: store?.updateSettings
  };
}
