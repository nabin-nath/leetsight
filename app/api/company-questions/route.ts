// /app/api/company-questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCollection, CompanyQuestionDocument } from '@/lib/mongodb'; // Adjust path
import { SortDirection } from 'mongodb';

const COMPANY_QUESTIONS_COLLECTION_NAME = process.env.COMPANY_QUESTIONS_COLLECTION || "company_questions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const company = searchParams.get('company');
    let role = searchParams.get('role');

    if (!company) {
      return NextResponse.json({ error: 'Company parameter is required' }, { status: 400 });
    }

    const query: any = { company_name: company };

    if (role && role !== "All Roles" && role !== "Unspecified Role (N/A)") {
      query.role_name = role;
    } else if (role === "Unspecified Role (N/A)") {
      query.role_name = "N/A";
    }
    // If role is "All Roles", no role_name filter is applied to query

    const companyQuestionsCollection = await getCollection<CompanyQuestionDocument>(COMPANY_QUESTIONS_COLLECTION_NAME);
    // Fetches all role documents for the company (or the specific role if filtered)
    // Each document contains an array of questions.
    // Server-side pagination of the inner 'questions' array is complex with a single find.
    // For now, this returns all questions for the matched company/role criteria.
    const companyData = await companyQuestionsCollection
                            .find(query)
                            .sort({ role_name: 1 as SortDirection }) // Sort roles alphabetically
                            .toArray();

    // Sort questions within each role document by lastSeenAt descending
    companyData.forEach(roleDoc => {
        if (roleDoc.questions && Array.isArray(roleDoc.questions)) {
            roleDoc.questions.sort((a, b) => {
                const dateA = a.lastSeenAt instanceof Date ? a.lastSeenAt.getTime() : new Date(a.lastSeenAt).getTime();
                const dateB = b.lastSeenAt instanceof Date ? b.lastSeenAt.getTime() : new Date(b.lastSeenAt).getTime();
                return dateB - dateA; // Descending
            });
        }
    });


    return NextResponse.json(companyData);
  } catch (error) {
    console.error("Error fetching company questions:", error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}