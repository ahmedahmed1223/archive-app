import { TokenAutocompleteField } from "../legacyComponentAdapter.js";
import { createLegacyComponent } from "../legacyComponentFactory.js";

export const TagAutocomplete = createLegacyComponent(TokenAutocompleteField, {
  id: "tag-autocomplete",
  legacyComponentName: "TokenAutocompleteField"
});

export default TagAutocomplete;
