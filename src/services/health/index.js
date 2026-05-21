export {
  runOperationPreflight,
  runStartupSequence
} from "../../runtime/legacyAdapter.js";
export {
  createOperationSizeCheck,
  createSqliteReadinessCheck,
  createStorageEstimateCheck,
  formatPreflightSummary
} from "./preflight.js";
export { STARTUP_SEQUENCE_STEP_DEFINITIONS } from "./startupSteps.js";

export function getSystemHealthActions(store) {
  return {
    runSystemHealthCheck: store?.runSystemHealthCheck,
    updateSettings: store?.updateSettings
  };
}
