import { unstable_flag as flag } from "@vercel/flags/next";

export const isChatEnabled = flag({
    key: "chat",
    description: "Enable chat",
    decide: async () => false,
    defaultValue: false,
});

export const isTodoEnabled = flag({
    key: "todo",
    description: "Enable todo",
    decide: async () => false,
    defaultValue: false,
});

export const precomputeFlags = [isChatEnabled, isTodoEnabled] as const;
