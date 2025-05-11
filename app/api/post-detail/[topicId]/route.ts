// /app/api/post-detail/[topicId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCollection, ProcessedPost } from '@/lib/mongodb'; // Adjust path

const PROCESSED_POSTS_COLLECTION_NAME = "processed_posts";

interface Params {
  topicId: string;
}

export async function GET(request: NextRequest, context: { params: Params }) {
  const { topicId } = context.params;
  const topicIdNum = parseInt(topicId, 10);

  if (isNaN(topicIdNum)) {
    return NextResponse.json({ error: 'Invalid Topic ID' }, { status: 400 });
  }

  try {
    const postsCollection = await getCollection<ProcessedPost>(PROCESSED_POSTS_COLLECTION_NAME);
    const post = await postsCollection.findOne({ topicId: topicIdNum });

    if (post) {
      return NextResponse.json(post);
    } else {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Error fetching post detail for ${topicId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}