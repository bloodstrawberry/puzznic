import type { Metadata } from "next";
import HomeView from "./home-view";

export const metadata: Metadata = {
  title: "Puzznic - Home",
  description: "Welcome to the Puzznic game home screen.",
};

export default function HomePage() {
  return <HomeView />;
}
