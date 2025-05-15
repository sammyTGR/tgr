import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // UploadThing handles authentication internally using the secret key
  // We don't need to check for an API key in the headers
  return NextResponse.next();
}

export const config = {
  matcher: '/api/uploadthing/:path*',
};
