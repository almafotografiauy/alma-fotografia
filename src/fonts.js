import { Fira_Sans, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";

export const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "500"], // light y medium
  variable: "--font-fira-sans",
});

export const voga = localFont({
  src: "../assets/fonts/Voga-Medium.otf",
  variable: "--font-voga",
  weight: "500",
  display: "swap",
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});