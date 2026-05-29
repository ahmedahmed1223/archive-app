import "./styles/tailwind.css";
import "./styles/app-overrides.css";
import "./styles/v1-identity.css";
import "./styles/v2-identity.css";

import { startVideoArchive } from "./app/startVideoArchive.js";
import { applyInitialTheme } from "./theme/applyInitialTheme.js";
import { applyInitialThemeVersion } from "./theme/applyInitialThemeVersion.js";

applyInitialThemeVersion();
applyInitialTheme();
startVideoArchive();
