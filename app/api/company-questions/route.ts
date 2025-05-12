// /app/api/company-questions/route.ts
import { NextRequest, NextResponse } from "next/server";
// Make sure to import getPaginatedCompanyQuestions from your lib/mongodb
import { getPaginatedCompanyQuestions } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const company = searchParams.get("company");
    const role = searchParams.get("role"); // This will be "All Roles", "N/A", or a specific role
    const timePeriod = searchParams.get("timePeriod");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10); // Default limit for questions

    if (!company || company === "All Companies") {
      // Require a specific company
      return NextResponse.json(
        { error: "Specific company parameter is required" },
        { status: 400 }
      );
    }

    // Role can be null if "All Roles" is implicitly handled by backend
    const roleFilter = role && role !== "All Roles" ? role : null;
    const timePeriodFilter =
      timePeriod && timePeriod !== "All Time" ? timePeriod : null; // <-- Use this

    // getPaginatedCompanyQuestions now returns an array, but for this API,
    // we expect one primary result based on the filters.
    const result = await getPaginatedCompanyQuestions(
      company,
      roleFilter,
      timePeriodFilter,
      page,
      limit
    );

    if (result && result.length > 0) {
      // If roleFilter was null (meaning "All Roles"), result[0] contains combined paginated questions.
      // If a specific role was filtered, result[0] contains paginated questions for that role.
      return NextResponse.json(result[0]); // Send the first (and likely only) element
    } else {
      // Handle case where no questions match (even if company/role exists)
      return NextResponse.json({
        questions: [],
        totalQuestions: 0,
        currentPage: page,
        totalPages: 1,
        roleName: role || "All Roles",
        companyName: company,
      });
    }
  } catch (error) {
    console.error("Error fetching company questions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
