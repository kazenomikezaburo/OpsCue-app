import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PreviewApp } from "./PreviewApp";
import "./styles.css";
const element = document.getElementById("root");
if (!element) throw new Error("Preview root missing");
createRoot(element).render(<StrictMode><PreviewApp /></StrictMode>);
