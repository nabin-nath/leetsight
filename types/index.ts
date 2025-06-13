export interface Company {
  name: string;
  id: number; // Assuming API returns number, but your CompanyOption used string | number
}

export interface CompanyOption {
  // For dropdowns
  name: string;
  id: string | number; // Keeping this flexible for now
}

export interface UserProfile {
  id: string;
  username: string;
  picture_url: string;
  full_name: string;
}

export interface ProcessedPost {
  topic_id: number;
  title: string;
  companies: Company[] | [];
  leetcode_created_at?: string | null;
  yoe: string;
  views?: number;
  tags: string[] | null;
  roles: string[] | [];
  questions_extracted: number;
  likes_count: number;
  dislikes_count: number;
  is_liked: boolean;
  is_disliked: boolean;
}

export interface RecentPostsApiResponse {
  items: ProcessedPost[];
  total_records: number;
  current_page: number;
  total_pages: number;
}

export interface Filters {
  // For Redux state and thunk arguments
  companyId?: string; // Use string for consistency with form/URL
  role?: string;
  pageSize: number; // Use number
  fromDate?: string; // Store as ISO string (yyyy-MM-dd)
  toDate?: string; // Store as ISO string
  page: number;
}

// For roles slice, mapping companyId to its roles and status
export interface RolesByCompany {
  roles: string[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export interface RolesState {
  [companyId: string]: RolesByCompany;
}

export interface PostResponse {
  post: Post;
  questions: Question[];
}

export interface Post {
  title: string;
  author: string | null;
  content: string;
  slug: string;
  tags: string[] | null;
  leetcode_created_at: string;
  upvote: number;
  downvote: number;
  yoe: number | null;
  views: number;
  company_ids: number[];
  status: string;
  topic_id: number;
  created_at: string;
  updated_at: string;
  companies: Company[];
  roles: string[] | [];
  likes_count: number;
  dislikes_count: number;
  is_liked: boolean;
  is_disliked: boolean;
}

export interface SimilarQuestion {
  question_id: string;
  source: string; // This should ideally be a URL or identifier
  score: number;
  id: string; // Assuming this is a unique ID for the similar question record
}

export interface Question {
  topic_id: number;
  question_text: string;
  role: string;
  company_id: number;
  tags: string[] | null;
  id: string;
  created_at: string;
  updated_at: string;
  similar_questions: SimilarQuestion[];
  companies: Company[];
  is_done: boolean;
  saved_in_lists: string[];
}

export interface PostDetailState {
  post: Post | null;
  questions: Question[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  // To handle optimistic updates for likes/dislikes on individual questions if needed
  questionStatus: Record<string, "idle" | "loading" | "succeeded" | "failed">;
}

export interface Company {
  id: number;
  name: string;
}

export interface UserListItem {
  // This is for items in a list of lists
  name: string;
  description: string;
  is_public: boolean;
  tags: string[];
  id: string; // list_id
  user_id: string;
  views: number;
  created_at: string;
  updated_at: string;
  questions_count: number;
  likes_count: number;
  dislikes_count: number;
  is_liked: boolean | null;
  user: UserProfile | null;
}

export interface QuestionInList {
  topic_id: number;
  question_text: string;
  role: string;
  company_id: number;
  tags: string[] | null;
  id: string;
  created_at: string;
  updated_at: string;
  similar_questions: SimilarQuestion[];
  companies: Company[];
  is_done: boolean;
  saved_in_lists: string[];
}

export interface ListDetail extends UserListItem {
  // Extends UserListItem with questions
  questions: QuestionInList[];
}

export interface PaginatedListState<T> {
  items: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export interface AllListsState {
  // New structure for userListSlice
  myLists: PaginatedListState<UserListItem>;
  publicLists: PaginatedListState<UserListItem>;
  // Potentially keep a combined/cached list if needed, or manage separately
}

export interface ListDetailReduxState {
  selectedListDetail: ListDetail | null; // Contains the list info AND its questions
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export interface UserListsApiResponse {
  items: UserListItem[];
  total_records: number;
  total_pages: number;
  current_page: number;
  has_next_page: boolean;
}
