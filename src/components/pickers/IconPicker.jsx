import { IconPicker as LegacyIconPicker } from "../legacyComponentAdapter.js";
import { createLegacyComponent } from "../legacyComponentFactory.js";

export const IconPicker = createLegacyComponent(LegacyIconPicker, {
  id: "icon-picker",
  legacyComponentName: "IconPicker"
});

export default IconPicker;
