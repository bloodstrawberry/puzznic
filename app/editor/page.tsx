import type { Metadata } from "next";
import EditorView from "./editor-view";

export const metadata: Metadata = {
  title: "Puzznic - Level Editor",
  description: "Create and edit custom levels for the Puzznic game.",
};

export default function EditorPage() {
  return <EditorView />;
}
