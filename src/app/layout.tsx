import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NaijaWatts — Generator & Power Cost Tracker",
  description: "Track your NEPA hours, generator fuel costs and electricity bills in Naira",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
