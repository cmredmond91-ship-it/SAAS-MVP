"use client";

import Script from "next/script";
import { GOOGLE_MAPS_API_URL } from "../lib/googleMaps";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Load Google Maps globally before app renders */}
      <Script src={GOOGLE_MAPS_API_URL} strategy="beforeInteractive" />
      {children}
    </>
  );
}

