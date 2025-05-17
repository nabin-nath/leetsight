// lib/mongodb.ts
import {
  MongoClient,
  Db,
  Collection,
  Document as MongoDocument,
  ObjectId,
  SortDirection,
  Filter,
} from "mongodb";

import { subWeeks, subMonths, startOfDay } from "date-fns";

const MONGODB_URI = process.env.MONGODB_URI; // Use the same .env variable as your Python setup
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}
if (!MONGODB_DB_NAME) {
  throw new Error(
    "Please define the MONGODB_DB_NAME environment variable inside .env.local"
  );
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  if (cachedClient && cachedDb) {
    // console.log('Using cached database instance');
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI!);
  // console.log('Connecting to MongoDB...');
  await client.connect();
  // console.log('Connected to MongoDB');
  const db = client.db(MONGODB_DB_NAME!);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Helper function to get a specific collection
export async function getCollection<T extends MongoDocument>(
  collectionName: string
): Promise<Collection<T>> {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
}

// You might also want to define interfaces for your document structures here
export interface ProcessedPost {
  // This interface can be used with TSchema
  _id?: ObjectId; // Optional on creation, present on retrieval
  topicId: number;
  title: string;
  slug: string;
  leetcodeCreatedAt?: Date | string | null;
  systemProcessedAt?: Date | string;
  companies_mentioned_in_post: string[];
  questions_extracted: ExtractedQuestion[];
}

export interface PaginatedCompanyQuestionsResponse {
  questions: CompanyQuestion[]; // Just the questions for the current page
  totalQuestions: number;
  currentPage: number;
  totalPages: number;
  roleName?: string; // Optionally return the role name if a single role was queried
  companyName?: string; // Optionally return company name
}

export interface ExtractedQuestion {
  original_question_text: string;
  tags: string[];
  refined_role: string;
  refined_company: string;
  // generated_identifiers?: Array<[string, string]>; // Optional
  similar_leetcode_questions: SimilarQuestion[];
  mapping_status?: string;
}

export interface SimilarQuestion {
  source: string;
  similarity_score: number;
}

export interface CompanyQuestionDocument extends MongoDocument {
  // This interface can be used with TSchema
  _id?: ObjectId;
  company_name: string;
  role_name: string;
  questions: CompanyQuestion[];
}

export interface CompanyQuestion {
  _instance_key: string;
  topicId: number;
  question_text: string;
  tags: string[];
  identifiers: string[];
  leetcodeCreatedAt?: Date | string | null;
  firstSeenAt: Date | string;
  lastSeenAt: Date | string;
}

export async function getPaginatedCompanyQuestions(
  companyName: string,
  roleFilter: string | null, // 'All Roles', 'N/A', or specific role
  timePeriodFilter: string | null,
  page: number,
  limit: number
): Promise<PaginatedCompanyQuestionsResponse[]> {
  // Returns an array of these, one per role if "All Roles"
  const companyQuestionsCollection =
    await getCollection<CompanyQuestionDocument>("company_questions");
  const skip = (page - 1) * limit;

  const baseMatchStage: Filter<CompanyQuestionDocument> = {
    company_name: companyName,
  };
  if (roleFilter && roleFilter !== "All Roles") {
    baseMatchStage.role_name =
      roleFilter === "Unspecified Role (N/A)" ? "N/A" : roleFilter;
  }

  // --- Build Time Period Filter for questions.leetcodeCreatedAt ---
  let timeFilterQueryPart: Filter<CompanyQuestion> = {}; // For filtering inside the questions array
  if (timePeriodFilter && timePeriodFilter !== "All Time") {
    const now = new Date();
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
    }
    if (startDate) {
      // This filter will be applied *after* unwinding questions
      timeFilterQueryPart = {
        leetcodeCreatedAt: { $gte: startOfDay(startDate) },
      };
      // console.log(
      //   `CompanyQuestions: Applying time filter: leetcodeCreatedAt >= ${startDate.toISOString()}`
      // );
    }
  }

  // --- Revised Aggregation Pipeline ---

  // Pipeline to get the total count of questions matching all filters
  const countPipeline: any[] = [
    { $match: baseMatchStage }, // Filter by company and role first
    { $unwind: "$questions" }, // Unwind the questions array
    {
      $match: {
        "questions.leetcodeCreatedAt": timeFilterQueryPart.leetcodeCreatedAt,
      },
    }, // Apply time filter if present
    // {$replaceRoot: {newRoot: "$questions"}}, // If you only want to count questions
    { $count: "totalQuestions" },
  ];
  // Adjust the match for timeFilterQueryPart if it's empty
  if (Object.keys(timeFilterQueryPart).length === 0) {
    countPipeline.splice(2, 1); // Remove the time filter stage if no time period is active
  }

  const countResult = await companyQuestionsCollection
    .aggregate(countPipeline)
    .toArray();
  const totalQuestions =
    countResult.length > 0 ? countResult[0].totalQuestions : 0;

  // Pipeline to fetch the paginated data
  const dataPipeline: any[] = [
    { $match: baseMatchStage }, // Filter by company and role
    { $unwind: "$questions" }, // Unwind questions
    {
      $match: {
        "questions.leetcodeCreatedAt": timeFilterQueryPart.leetcodeCreatedAt,
      },
    }, // Apply time filter to questions
    // Add context fields before promoting questions to root
    {
      $addFields: {
        "questions.role_name_context": "$role_name",
        "questions.company_name_context": "$company_name",
      },
    },
    { $replaceRoot: { newRoot: "$questions" } }, // Promote questions to top level
    { $sort: { lastSeenAt: -1 as SortDirection } }, // Sort the resulting questions
    { $skip: skip },
    { $limit: limit },
  ];
  if (Object.keys(timeFilterQueryPart).length === 0) {
    dataPipeline.splice(2, 1); // Remove time filter stage if not active
  }

  const paginatedQuestionsList = (await companyQuestionsCollection
    .aggregate(dataPipeline)
    .toArray()) as CompanyQuestion[];

  return [
    {
      questions: paginatedQuestionsList,
      totalQuestions: totalQuestions,
      currentPage: page,
      totalPages: Math.ceil(totalQuestions / limit) || 1,
      roleName:
        roleFilter && roleFilter !== "All Roles" ? roleFilter : "All Roles",
      companyName: companyName,
    },
  ];
}
