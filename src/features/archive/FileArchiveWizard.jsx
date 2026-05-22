// Transitional adapter: the wizard still depends on legacy runtime helpers.
// Keeping the import here gives ArchivePage a feature-local boundary while the
// heavy scanner internals move out in a later refactor pass.
export { FileArchiveWizard } from "../../runtime/legacyAdapter.js";
