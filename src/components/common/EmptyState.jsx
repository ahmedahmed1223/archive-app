import { EmptyState as LegacyEmptyState } from "../legacyComponentAdapter.js";
import { createLegacyComponent } from "../legacyComponentFactory.js";

export const EmptyState = createLegacyComponent(LegacyEmptyState, {
  id: "empty-state",
  legacyComponentName: "EmptyState"
});

export default EmptyState;
