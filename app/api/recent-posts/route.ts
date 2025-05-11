// /app/api/recent-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCollection, ProcessedPost } from "@/lib/mongodb"; // Adjust path if needed
import { SortDirection } from "mongodb";
import { subWeeks, subMonths, startOfDay, subYears } from "date-fns";

const PROCESSED_POSTS_COLLECTION_NAME = "processed_posts";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const companyFilter = searchParams.get("company");
    const timePeriodFilter = searchParams.get("timePeriod");

    const skip = (page - 1) * limit;

    const postsCollection = await getCollection<ProcessedPost>(
      PROCESSED_POSTS_COLLECTION_NAME
    );

    const query: any = {
      questions_extracted: { $exists: true, $not: { $size: 0 } }, // Must exist and not be empty
    };

    if (companyFilter && companyFilter !== "All Companies") {
      query["companies_mentioned_in_post"] = companyFilter;
    }

    // --- Add Time Period Filter Logic ---
    if (timePeriodFilter && timePeriodFilter !== "All Time") {
      const now = new Date(); // Current date in server's timezone (usually UTC on Vercel)
      let startDate: Date | null = null;

      switch (timePeriodFilter) {
        case "Last Week":
          startDate = subWeeks(now, 1);
          break;
        case "Last Month":
          startDate = subMonths(now, 1);
          break;
        case "Last 3 Months":
          startDate = subMonths(now, 3);
          break;
        // Add more cases like "Last Year" if needed
        case "Last Year":
          startDate = subYears(now, 1);
          break;
      }

      if (startDate) {
        // Ensure we compare against the start of that day for inclusivity
        query.leetcodeCreatedAt = { $gte: startOfDay(startDate) }; // Assumes leetcodeCreatedAt is stored as BSON Date
        console.log(
          `Applying time filter: leetcodeCreatedAt >= ${startDate.toISOString()}`
        );
      }
    }

    const posts = await postsCollection
      .find(query)
      .sort({ leetcodeCreatedAt: -1 as SortDirection }) // Sort by original post date
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPostsCount = await postsCollection.countDocuments(query);

    console.log(
      `API: Fetched ${posts.length} posts for page ${page}, company: '${companyFilter}', time: '${timePeriodFilter}'`
    );

    return NextResponse.json({
      posts: posts, // Driver handles BSON to JSON conversion (like ObjectId to string)
      totalPosts: totalPostsCount,
      currentPage: page,
      totalPages: Math.ceil(totalPostsCount / limit) || 1,
    });
  } catch (error) {
    console.error("Error fetching recent posts:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
