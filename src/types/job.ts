/**
 * Job interface for API responses and app state
 */
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  matchRate: number;
  postedDate: string;
  postedDateISO?: string; // Original ISO date string for sorting
  description: string;
  requirements: string[];
  responsibilities?: string[];
  benefits?: string[];
  companyInfo?: {
    name: string;
    size?: string;
    industry?: string;
    description?: string;
    logo?: string;
  };
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  remote?: boolean;
  url?: string;
}

/**
 * Job search parameters for API calls
 */
export interface JobSearchParams {
  query: string;
  location?: string;
  limit?: number;
  fromage?: number; // days back
  jobType?: string;
  experienceLevel?: string;
  remote?: boolean;
  maxPages?: number; // maximum pages to fetch (default: 10 for all available results)
}

/**
 * API response structure for job searches
 */
export interface JobSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoadingMore?: boolean;
  allJobsLoaded?: boolean;
}

/**
 * Progressive loading state for job results
 */
export interface JobLoadingState {
  displayedJobs: Job[];
  allJobs: Job[];
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  isLoadingBackground: boolean;
  hasMoreToShow: boolean;
  backgroundLoadComplete: boolean;
  currentDisplayCount: number;
  totalAvailable: number;
}

/**
 * Resume analysis result for job matching
 */
export interface ResumeAnalysis {
  skills: string[];
  experience: string[];
  education: string[];
  matchScore: number;
  recommendations: string[];
} 