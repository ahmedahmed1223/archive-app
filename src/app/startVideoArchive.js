import { mountVideoArchive } from "./App.jsx";

export function startVideoArchive(rootId = "root") {
  const rootElement = document.getElementById(rootId);

  if (!rootElement) {
    throw new Error(`Unable to start Video Archive: #${rootId} was not found.`);
  }

  return mountVideoArchive(rootElement);
}
