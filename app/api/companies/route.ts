// /app/api/companies/route.ts
import { NextResponse } from 'next/server';
import { getCollection, CompanyQuestionDocument } from '@/lib/mongodb'; // Adjust path
import { auth } from "@/app/api/auth/auth"


const COMPANY_QUESTIONS_COLLECTION_NAME = process.env.COMPANY_QUESTIONS_COLLECTION || "company_questions";

export async function GET(request: Request) {

  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const companyQuestionsCollection = await getCollection<CompanyQuestionDocument>(COMPANY_QUESTIONS_COLLECTION_NAME);
    const distinctCompanies = await companyQuestionsCollection.distinct("company_name", {
      company_name: { "$ne": "N/A" } // Exclude "N/A"
    });

    // console.log("Distinct Companies:", distinctCompanies);

    return NextResponse.json(distinctCompanies.sort());
  } catch (error) {
    console.error("Error fetching distinct companies:", error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}