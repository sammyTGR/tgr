import { NextResponse } from 'next/server';
import { getAcknowledgments } from '@/app/TGR/crew/bulletin/actions';

export async function GET() {
  try {
    const acknowledgments = await getAcknowledgments();
    return NextResponse.json(acknowledgments);
  } catch (error) {
    console.error('Error fetching acknowledgments:', error);
    return NextResponse.json({ error: 'Failed to fetch acknowledgments' }, { status: 500 });
  }
}
