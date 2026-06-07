// Mirrors com.samir.uniguide.model.enums.*
export type Role = 'STUDENT' | 'ADMIN';

export type GuideCategory =
  | 'DAILY_LIFE'
  | 'STUDIES'
  | 'BUREAUCRACY'
  | 'ENTERTAINMENT'
  | 'TRAVEL'
  | 'HEALTHCARE'
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

// ---- Errors ----
export interface ErrorResponse {
  status: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
