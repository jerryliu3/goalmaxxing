import { createRoot } from "react-dom/client";
import { InteractionLab } from "./study";
const root = document.getElementById("root");
if (root) createRoot(root).render(<InteractionLab researchUrl="./research.html" />);
