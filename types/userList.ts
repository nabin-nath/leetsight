export interface UserListItem {
  name: string;
  description: string;
  is_public: boolean;
  tags: string[];
  id: string;
  user_id: string;
  views: number;
  created_at: string;
  updated_at: string;
  questions_count: number;
  likes_count: number;
  dislikes_count: number;
  is_liked: boolean | null;
}

export interface UserListsApiResponse {
  items: UserListItem[];
  total_records: number;
  total_pages: number;
  current_page: number;
  has_next_page: boolean;
}
