import { type NextRequest, NextResponse } from "next/server";
import { type ApiData, verifyAccess } from "@vercel/flags";

export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get("Authorization"));
  if (!access) return NextResponse.json(null, { status: 401 });

  return NextResponse.json<ApiData>({
    definitions: {
      isChatEnabled: {
        description: "Enable chat",
        origin: 'https://tgr-dashboard.vercel.app/TGR/crew/chat',
        options: [
          { value: false, label: 'Off' },
          { value: true, label: 'On' },
        ],
    },
    isTodoEnabled: {
      description: "Enable todo",
      origin: 'https://tgr-dashboard.vercel.app/admin/todo/todo-wrapper',
      options: [
        { value: false, label: 'Off' },
        { value: true, label: 'On' },
      ],
    },
    },
  });
}