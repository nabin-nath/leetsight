// lib/mongodb.ts
import { MongoClient, Db, Collection, Document as MongoDocument, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI; // Use the same .env variable as your Python setup
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}
if (!MONGODB_DB_NAME) {
  throw new Error('Please define the MONGODB_DB_NAME environment variable inside .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
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
export async function getCollection<T extends MongoDocument>(collectionName: string): Promise<Collection<T>> {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
}

// You might also want to define interfaces for your document structures here
export interface ProcessedPost { // This interface can be used with TSchema
  _id?: ObjectId; // Optional on creation, present on retrieval
  topicId: number;
  title: string;
  slug: string;
  leetcodeCreatedAt?: Date | string | null;
  systemProcessedAt?: Date | string;
  companies_mentioned_in_post: string[];
  questions_extracted: ExtractedQuestion[];
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

export interface CompanyQuestionDocument extends MongoDocument { // This interface can be used with TSchema
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
