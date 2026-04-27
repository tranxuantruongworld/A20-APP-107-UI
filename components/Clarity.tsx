"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function MicrosoftClarity() {
  const CLARITY_ID = process.env.CLARITY_ID || ""
  useEffect(() => {
    Clarity.init(CLARITY_ID);
  }, []);

  return null;
}
