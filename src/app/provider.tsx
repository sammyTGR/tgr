"use client";

import flagsmith from "flagsmith/isomorphic";
import { FlagsmithProvider } from "flagsmith/react";
import { IState } from "flagsmith/types";
import { ReactElement } from "react";

export default function Provider({
  children,
  flagsmithState,
}: {
  children: React.ReactNode;
  flagsmithState?: IState;
}) {
  return (
    <FlagsmithProvider flagsmith={flagsmith} serverState={flagsmithState}>
      {children as ReactElement}
    </FlagsmithProvider>
  );
}
