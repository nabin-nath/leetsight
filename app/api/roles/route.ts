// /app/api/roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCollection, CompanyQuestionDocument } from '@/lib/mongodb'; // Adjust path

const COMPANY_QUESTIONS_COLLECTION_NAME = process.env.COMPANY_QUESTIONS_COLLECTION || "company_questions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const company = searchParams.get('company');

    if (!company) {
      return NextResponse.json({ error: 'Company parameter is required' }, { status: 400 });
    }

    const companyQuestionsCollection = await getCollection<CompanyQuestionDocument>(COMPANY_QUESTIONS_COLLECTION_NAME);
    const distinctRoles = await companyQuestionsCollection.distinct("role_name", {
      company_name: company
    });

    return NextResponse.json(distinctRoles.filter(role => role !== null).sort()); // Filter out nulls
  } catch (error) {
    console.error("Error fetching roles for company:", error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}