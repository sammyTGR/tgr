import { NextResponse } from 'next/server';
import { getBulletinPosts } from '@/app/TGR/crew/bulletin/actions';

export async function GET() {
  try {
    const posts = await getBulletinPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching bulletin posts:', error);
    return NextResponse.json({ error: 'Failed to fetch bulletin posts' }, { status: 500 });
  }
}
