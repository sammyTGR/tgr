"use client";

import { useGateValue } from "@statsig/react-bindings";
import * as React from "react";

export default function StatsigPage() {
  const gate = useGateValue("enable_todo");

  return <div>Gate Value: {gate ? "PASSED" : "FAILED"}</div>;
}
