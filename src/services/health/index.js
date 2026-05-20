export {
  runOperationPreflight,
  runStartupSequence
} from "../../runtime/videoArchiveRuntime.js";

export function getSystemHealthActions(store) {
  return {
    runSystemHealthCheck: store?.runSystemHealthCheck,
    updateSettings: store?.updateSettings
  };
}
