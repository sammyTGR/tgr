import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/auth/service';

export async function GET() {
    try {
        const authResult = await getAuthenticatedClient();
        return NextResponse.json(authResult);
    } catch (error: any) {
        console.error('Authentication error:', error);
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 500 }
        );
    }
}

export async function POST() {
    try {
        const authResult = await getAuthenticatedClient();
        return NextResponse.json(authResult);
    } catch (error: any) {
        console.error('Authentication error:', error);
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 500 }
        );
    }
}