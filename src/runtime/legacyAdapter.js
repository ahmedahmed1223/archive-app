/*
 * Transitional boundary for the original extracted runtime.
 *
 * New modules should import legacy behavior from this adapter only. This keeps
 * the remaining coupling visible while pages, stores, services, and components
 * move out of videoArchiveRuntime.js in small, verifiable steps.
 */
export * from "./videoArchiveRuntime.js";
