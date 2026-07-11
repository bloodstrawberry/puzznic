import type { Metadata } from "next";
import GameView from "./game-view";

export const metadata: Metadata = {
  title: "Puzznic - Play Game",
  description: "Play classic and custom levels of the Puzznic game.",
};

export default function GamePage() {
  return <GameView />;
}
