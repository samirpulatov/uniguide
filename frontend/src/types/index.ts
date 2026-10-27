// Mirrors com.samir.uniguide.model.enums.*
export type Role = 'STUDENT' | 'ADMIN';

export type GuideCategory =
  | 'DAILY_LIFE'
  | 'STUDIES'
  | 'BUREAUCRACY'
  | 'ENTERTAINMENT'
  | 'TRAVEL'
  | 'HEALTHCARE'
  | 'HOUSING'
  | 'OTHER';

// Kept separate from GuideCategory on the backend on purpose (the two may diverge later)
export type ForumCategory =
  | 'DAILY_LIFE'
  | 'STUDIES'
  | 'BUREAUCRACY'
  | 'ENTERTAINMENT'
  | 'TRAVEL'
  | 'HEALTHCARE'
  | 'HOUSING'
  | 'OTHER';

export type GuideStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type City =
  | 'SIEGEN'
  | 'BOCHUM'
  | 'AACHEN'
  | 'DORTMUND'
  | 'COLOGNE'
  | 'DUSSELDORF'
  | 'MUNSTER'
  | 'BONN'
  | 'PADERBORN';

export type University = 'UNI_SIEGEN' | 'RUB_BOCHUM' | 'RWTH_AACHEN';

// University -> City, mirrors University.getCity() so the frontend can cascade the dropdowns
export const UNIVERSITY_CITY: Record<University, City> = {
  UNI_SIEGEN: 'SIEGEN',
  RUB_BOCHUM: 'BOCHUM',
  RWTH_AACHEN: 'AACHEN',
};

// ---- Auth ----
export interface RegisterRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LoginRequest {
  login: string; // username or email
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

// ---- User ----
export interface GetUserResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  city: City | null;
  university: University | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  city: City | null;
  university: University | null;
}

export interface UpdateUserResponse {
  user: GetUserResponse;
  accessToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ---- Guides ----
export interface GuideCreationRequest {
  title: string;
  content: string;
  guideCategory: GuideCategory;
  city: City | null;
  university: University | null;
}

export interface GuideCreationResponse {
  id: number;
  title: string;
  content: string;
  category: GuideCategory;
  authorName: string;
  city: City | null;
  university: University | null;
  createdAt: string;
  updatedAt: string;
  status: GuideStatus;
  rejectionReason: string | null;
}

export interface GuideReviewRequest {
  action: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

// ---- Forum ----
export interface ForumThreadRequest {
  title: string;
  content: string;
  forumCategory: ForumCategory | null;
  city: City | null;
  university: University | null;
}

export interface ForumReplyResponse {
  id: number;
  // null when the reply is deleted — the backend hides who wrote it
  authorName: string | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  // soft-deleted: content is only the tombstone text, children are still kept in the tree
  deleted: boolean;
  replies: ForumReplyResponse[] | null;
}

export interface ForumThreadResponse {
  id: number;
  authorName: string;
  title: string;
  content: string;
  forumCategory: ForumCategory | null;
  city: City | null;
  university: University | null;
  createdAt: string;
  updatedAt: string | null;
  // only filled by GET /forum/threads/{id}; null in list responses
  replies: ForumReplyResponse[] | null;
}

export interface ForumReplyRequest {
  content: string;
  // null/omitted = top-level reply to the thread
  parentReplyId?: number | null;
}

// ---- Todo tasks ----
export interface TodoTaskCreationRequest {
  content: string;
}

// PATCH: send only the fields to change — omitted ones stay as they are
export interface UpdateTodoTaskRequest {
  content?: string;
  completed?: boolean;
}

export interface TodoTaskResponse {
  id: number;
  content: string;
  completed: boolean;
  createdAt: string;
}

// ---- Housing ----
export type HouseType = 'WG_ROOM' | 'APARTMENT' | 'DORM';

// BigDecimal fields arrive as JSON numbers
export interface HousingResponse {
  id: number;
  houseType: HouseType;
  title: string;
  coldRent: number;
  warmRent: number;
  area: number;
  // optional on the backend (@PositiveOrZero without @NotNull)
  deposit: number | null;
  city: City;
  postCode: string;
  street: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  authorName: string;
}

// Body of POST /housing and PUT /housing/{id} (PUT replaces the whole listing)
export interface HousingRequest {
  houseType: HouseType;
  title: string;
  coldRent: number;
  warmRent: number;
  area: number;
  deposit: number | null;
  city: City;
  postCode: string;
  street: string;
  content: string;
}

// ---- Housing photos ----
// metadata only: the image itself is loaded by id via housingPhotosApi.getPhotoBlob
export interface HousingPhotoResponse {
  id: string;
  createdAt: string;
}

// ---- Jobs ----
export type JobType = 'MINIJOB' | 'PRAKTIKUM' | 'WERKSTUDENT' | 'TEILZEIT';

// salaryPerHour is always € per hour; 0 = unpaid (e.g. Pflichtpraktikum)
export interface JobVacancyResponse {
  id: number;
  title: string;
  city: City;
  jobType: JobType;
  company: string;
  salaryPerHour: number;
  description: string;
  createdAt: string;
  updatedAt: string | null;
  authorName: string;
}

// Body of POST /jobs and PUT /jobs/{id} (PUT replaces the whole vacancy)
export interface JobVacancyRequest {
  title: string;
  city: City;
  jobType: JobType;
  company: string;
  salaryPerHour: number;
  description: string;
}

// ---- Errors ----
export interface ErrorResponse {
  status: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
