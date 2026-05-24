import "./styles/generated-tailwind.css";
import "./styles/app-overrides.css";
import "./styles/v1-identity.css";

import { startVideoArchive } from "./app/startVideoArchive.js";
import { applyInitialTheme } from "./theme/applyInitialTheme.js";

applyInitialTheme();
startVideoArchive();
