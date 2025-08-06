import axios from 'axios';
import { Job, JobSearchParams, JobSearchResponse, ResumeAnalysis } from '../types/job';
import { CONFIG } from './config';
import { jobCache } from './jobCache';

/**
 * Raw job data from API response
 */
interface RawJobData {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_salary?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_salary_period?: string;
  job_posted_at_datetime_utc?: string;
  job_description?: string;
  job_employment_type?: string;
  job_is_remote?: boolean;
  job_apply_link?: string;
  job_apply_is_direct?: boolean;
  employer_logo?: string;
  employer_company_type?: string;
  job_benefits?: any[];
}

/**
 * Job API service for fetching job data
 * Integrates with JSearch API - no mock data fallback
 */
class JobApiService {
  private readonly RAPIDAPI_KEY = CONFIG.RAPIDAPI_KEY;
  private readonly RAPIDAPI_URL = CONFIG.RAPIDAPI_URL;

  /**
   * Search for jobs using JSearch API with progressive loading
   * Returns first batch immediately, continues loading in background
   */
  async searchJobs(params: JobSearchParams, progressCallback?: (jobs: Job[]) => void): Promise<JobSearchResponse> {
    try {
      // Check cache first
      const cachedJobs = await jobCache.getCachedJobs(params);
      if (cachedJobs) {
        console.log(`Returning ${cachedJobs.length} jobs from cache for query: "${params.query}"`);
        return {
          jobs: cachedJobs,
          total: cachedJobs.length,
          page: 1,
          hasMore: false,
        };
      }

      // Check if we can make an API request
      const { canMakeRequest, remainingRequests } = await jobCache.trackRequest();
      
      if (!canMakeRequest) {
        console.warn(`[ADMIN] API request limit reached (0/${remainingRequests} remaining). No cached data available.`);
        return {
          jobs: [],
          total: 0,
          page: 1,
          hasMore: false,
        };
      }

      // Check if API key is configured
      if (!this.RAPIDAPI_KEY) {
        console.warn('No JSearch API key configured. Please add EXPO_PUBLIC_RAPIDAPI_KEY to your .env file.');
        return {
          jobs: [],
          total: 0,
          page: 1,
          hasMore: false,
        };
      }

      // Make API request with progressive loading
      console.log(`Making API request for query: "${params.query}" (${remainingRequests - 1} requests remaining)`);
      const response = await this.searchRapidApiJobsProgressive(params, progressCallback);
      
      // Cache the results if we got any
      if (response.jobs.length > 0) {
        await jobCache.cacheJobs(params, response.jobs, response.total);
        console.log(`Successfully cached ${response.jobs.length} jobs from API`);
      } else {
        console.log('No jobs returned from API - nothing to cache');
      }
      
      return response;
      
    } catch (error) {
      console.error('Job search failed:', error);
      
      // Return empty results on error - no mock data fallback
      return {
        jobs: [],
        total: 0,
        page: 1,
        hasMore: false,
      };
    }
  }

  /**
   * Search jobs using RapidAPI JSearch with progressive loading
   * Returns first 10 results immediately, then loads more in background
   */
  private async searchRapidApiJobsProgressive(params: JobSearchParams, progressCallback?: (jobs: Job[]) => void): Promise<JobSearchResponse> {
    // Format location for better API compatibility
    const formattedLocation = this.formatLocationForApi(params.location);
    const maxPages = params.maxPages || 10;
    
    console.log(`Starting progressive loading for query: "${params.query}"`);
    
    let allJobs: any[] = [];
    let firstBatchReturned = false;
    
    // Fetch first page immediately
    try {
      console.log('Fetching first page for immediate display...');
      
      const firstPageResponse = await axios.get(`${this.RAPIDAPI_URL}/search`, {
        headers: {
          'X-RapidAPI-Key': this.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        },
        params: {
          query: params.query,
          location: formattedLocation,
          num_pages: 1,
          page: 1,
          date_posted: 'month'
        },
        timeout: 10000 // Reduced to 10 seconds for first page
      });
      
      const firstPageData = firstPageResponse.data?.data || [];
      allJobs.push(...firstPageData);
      
      console.log(`First page loaded: ${firstPageData.length} jobs`);
      
      // Transform and return first batch immediately
      const firstBatchResponse = this.transformRapidApiResponse({
        data: firstPageData,
        parameters: { query: params.query, location: formattedLocation }
      }, params.location);
      
      // Start background loading for remaining pages (don't await - let it run in background)
      if (firstPageData.length >= 10 && maxPages > 1) {
        // Fire and forget - don't block the initial response
        this.loadRemainingPagesInBackground(params, formattedLocation, maxPages, allJobs, progressCallback)
          .catch(error => {
            console.warn('Background loading failed, but first page was successful:', error);
          });
      }
      
      return {
        ...firstBatchResponse,
        hasMore: firstPageData.length >= 10 && maxPages > 1
      };
      
    } catch (error) {
      console.error('Error fetching first page:', error);
      
      // If it's a timeout error, provide more helpful error message
      if ((error as any).code === 'ECONNABORTED' || (error as any).message?.includes('timeout')) {
        throw new Error('Search request timed out. The job search API might be slow. Please try again with a more specific search query or try again later.');
      }
      
      throw error;
    }
  }
  
  /**
   * Load remaining pages in background and notify via callback
   */
  private async loadRemainingPagesInBackground(
    params: JobSearchParams, 
    formattedLocation: string | undefined, 
    maxPages: number, 
    allJobs: any[], 
    progressCallback?: (jobs: Job[]) => void
  ): Promise<void> {
    console.log('Starting background loading of remaining pages...');
    
    // Continue fetching remaining pages in background
    for (let currentPage = 2; currentPage <= maxPages; currentPage++) {
      try {
        console.log(`Background loading page ${currentPage}/${maxPages}...`);
        
        const response = await axios.get(`${this.RAPIDAPI_URL}/search`, {
          headers: {
            'X-RapidAPI-Key': this.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
          },
          params: {
            query: params.query,
            location: formattedLocation,
            num_pages: 1,
            page: currentPage,
            date_posted: 'month'
          },
          timeout: 8000 // Reduced timeout for background requests
        });
        
        const pageData = response.data?.data || [];
        
        if (pageData.length === 0) {
          console.log(`No more results found on page ${currentPage}. Stopping background loading.`);
          break;
        }
        
        allJobs.push(...pageData);
        
        // Transform new jobs and notify via callback
        if (progressCallback) {
          const transformedResponse = this.transformRapidApiResponse({
            data: allJobs,
            parameters: { query: params.query, location: formattedLocation }
          }, params.location);
          
          progressCallback(transformedResponse.jobs);
        }
        
        console.log(`Background page ${currentPage}: Found ${pageData.length} jobs (Total: ${allJobs.length})`);
        
        // If we got fewer results than expected, we've likely reached the end
        if (pageData.length < 10) {
          console.log(`Background loading complete: ${pageData.length} jobs on last page`);
          break;
        }
        
        // Add delay between background requests
        await new Promise(resolve => setTimeout(resolve, 300)); // Slightly longer delay to be more respectful
        
      } catch (error) {
        console.warn(`Error in background loading page ${currentPage}:`, error);
        // Don't break on timeout - try next page after a longer delay
        if ((error as any).code === 'ECONNABORTED' || (error as any).message?.includes('timeout')) {
          console.log('Timeout occurred, waiting longer before next request...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second on timeout
          continue; // Try next page
        }
        // Break on other errors
        break;
      }
    }
    
    console.log(`Background loading completed: ${allJobs.length} total jobs loaded`);
  }
  
  /**
   * Legacy method - kept for backward compatibility but now uses progressive loading
   */
  private async searchRapidApiJobs(params: JobSearchParams): Promise<JobSearchResponse> {
    // Format location for better API compatibility
    const formattedLocation = this.formatLocationForApi(params.location);
    const maxPages = params.maxPages || 10; // Default to 10 pages for comprehensive results
    
    console.log(`Fetching up to ${maxPages} pages of results for query: "${params.query}"`);
    
    let allJobs: any[] = [];
    let currentPage = 1;
    let totalResultsFound = 0;
    
    // This is the legacy method - just fetch first page for compatibility
    try {
              const response = await axios.get(`${this.RAPIDAPI_URL}/search`, {
          headers: {
            'X-RapidAPI-Key': this.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
          },
          params: {
            query: params.query,
            location: formattedLocation,
            num_pages: 1,
            page: 1,
            date_posted: 'month'
          },
          timeout: 10000 // Reduced timeout for legacy method too
        });
      
      const pageData = response.data?.data || [];
      allJobs.push(...pageData);
      totalResultsFound = pageData.length;
      
    } catch (error) {
      console.warn('Error in legacy search method:', error);
      throw error;
    }
    
    console.log(`Multi-page search completed: ${totalResultsFound} total jobs found across ${currentPage - 1} pages`);
    
    // Create a mock response object with all the collected data
    const mockResponse = {
      data: allJobs,
      parameters: {
        query: params.query,
        location: formattedLocation,
        num_pages: currentPage - 1,
        page: 1
      }
    };

    return this.transformRapidApiResponse(mockResponse, params.location);
  }

  /**
   * Transform RapidAPI response to our format
   */
  private transformRapidApiResponse(data: any, requestedLocation?: string): JobSearchResponse {
    console.log('Raw API response data count:', data.data?.length || 0);
    
    if (!data.data || !Array.isArray(data.data)) {
      console.warn('Invalid API response format - no data array found');
      return {
        jobs: [],
        total: 0,
        page: 1,
        hasMore: false
      };
    }
    
    const jobs: Job[] = data.data.map((job: RawJobData, index: number) => ({
      id: job.job_id || `api-${Date.now()}-${index}`,
      title: job.job_title || 'Position Title Not Available',
      company: job.employer_name || 'Company Name Not Available',
      location: this.formatLocation(job),
      salary: this.formatSalary(job),
      salary_min: job.job_min_salary,
      salary_max: job.job_max_salary,
      salary_currency: job.job_salary_currency || 'USD',
      matchRate: this.calculateMatchRate(job),
      postedDate: this.formatPostedDate(job.job_posted_at_datetime_utc || ''),
      postedDateISO: job.job_posted_at_datetime_utc || '',
      description: job.job_description || 'No description available',
      requirements: this.extractRequirements(job.job_description || ''),
      jobType: job.job_employment_type || 'full-time',
      experienceLevel: this.determineExperienceLevel(job.job_title || ''),
      remote: job.job_is_remote || false,
      url: job.job_apply_link || job.job_apply_is_direct ? job.job_apply_link : '',
      companyInfo: {
        name: job.employer_name || 'Company Name Not Available',
        logo: job.employer_logo,
        description: job.employer_company_type
      }
    })).filter((job: Job) => job.title !== 'Position Title Not Available'); // Filter out invalid jobs

    // Apply client-side location filtering if location was specified
    const filteredJobs = requestedLocation 
      ? this.filterJobsByLocation(jobs, requestedLocation)
      : jobs;

    console.log(`Successfully transformed ${jobs.length} valid jobs from API response`);
    if (requestedLocation && filteredJobs.length !== jobs.length) {
      console.log(`Location filtering: ${jobs.length} → ${filteredJobs.length} jobs after filtering for "${requestedLocation}"`);
    }

    return {
      jobs: filteredJobs,
      total: filteredJobs.length,
      page: 1,
      hasMore: false // We've fetched all available pages, so no more results
    };
  }

  /**
   * Format location from API response
   */
  private formatLocation(job: RawJobData): string {
    const parts = [];
    if (job.job_city) parts.push(job.job_city);
    if (job.job_state) parts.push(job.job_state);
    if (job.job_country && !parts.length) parts.push(job.job_country);
    
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  }

  /**
   * Format salary from API response
   */
  private formatSalary(job: RawJobData): string {
    if (job.job_salary) return job.job_salary;
    
    if (job.job_min_salary && job.job_max_salary) {
      const currency = job.job_salary_currency || 'USD';
      const period = job.job_salary_period || 'year';
      return `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()} ${currency}/${period}`;
    }
    
    if (job.job_min_salary) {
      const currency = job.job_salary_currency || 'USD';
      const period = job.job_salary_period || 'year';
      return `From $${job.job_min_salary.toLocaleString()} ${currency}/${period}`;
    }
    
    return 'Salary not specified';
  }

  /**
   * Calculate match rate based on job content (simplified)
   */
  private calculateMatchRate(job: RawJobData): number {
    // Simple scoring based on available information
    let score = 60; // Base score
    
    if (job.job_description && job.job_description.length > 100) score += 10;
    if (job.job_apply_link) score += 5;
    if (job.job_salary || job.job_min_salary) score += 10;
    if (job.employer_logo) score += 5;
    if (job.job_benefits && job.job_benefits.length > 0) score += 10;
    
    return Math.min(score, 95); // Cap at 95%
  }

  /**
   * Extract requirements from job description using simple keyword matching
   */
  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const lowerDesc = description.toLowerCase();
    
    // Common tech skills
    const techSkills = [
      'react native', 'typescript', 'javascript', 'react', 'node.js', 'python', 'java',
      'swift', 'kotlin', 'flutter', 'ios', 'android', 'mobile development',
      'api', 'rest api', 'graphql', 'database', 'sql', 'nosql', 'mongodb',
      'aws', 'azure', 'git', 'agile', 'scrum', 'ci/cd'
    ];
    
    const foundSkills = techSkills
      .filter(skill => lowerDesc.includes(skill))
      .slice(0, 5); // Limit to 5 skills
    
    requirements.push(...foundSkills.map(skill => 
      skill.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ));
    
    // Add generic requirements if none found
    if (requirements.length === 0) {
      requirements.push('Relevant experience required', 'Strong communication skills');
    }
    
    return requirements;
  }

  /**
   * Determine experience level from job title
   */
  private determineExperienceLevel(title: string): 'entry' | 'mid' | 'senior' | 'executive' {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('senior') || lowerTitle.includes('lead')) return 'senior';
    if (lowerTitle.includes('junior') || lowerTitle.includes('entry')) return 'entry';
    if (lowerTitle.includes('executive') || lowerTitle.includes('director')) return 'executive';
    return 'mid';
  }

  /**
   * Format posted date from API response
   */
  private formatPostedDate(dateString: string): string {
    if (!dateString) return 'Recently posted';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch (error) {
      return 'Recently posted';
    }
  }

  /**
   * Analyze resume and return matching data
   */
  async analyzeResume(resumeText: string, jobTitle: string): Promise<ResumeAnalysis> {
    // Mock resume analysis - in real app, this would use NLP/AI
    const skills = ['React Native', 'TypeScript', 'JavaScript', 'Mobile Development', 'Git'];
    const experience = ['3+ years mobile development', 'Cross-platform development', 'UI/UX design'];
    const education = ['Bachelor\'s in Computer Science'];
    
    const matchScore = Math.floor(Math.random() * 30) + 70; // 70-100%
    
    const recommendations = [
      'Add more React Native projects to your portfolio',
      'Include specific mobile app metrics in your resume',
      'Highlight your TypeScript experience',
      'Add certifications related to mobile development',
    ];

    return {
      skills,
      experience,
      education,
      matchScore,
      recommendations
    };
  }

  /**
   * Clear any cached data to ensure fresh API results
   * Useful for debugging and ensuring no mock data is cached
   */
  async clearAllCachedData(): Promise<void> {
    await jobCache.clearCache();
    console.log('All cached job data cleared - next searches will use fresh API data');
  }

  /**
   * Admin-only: Get API usage statistics for monitoring
   * This should only be used for admin/development purposes
   */
  async _getAdminStats() {
    if (__DEV__) {
      const requestStats = await jobCache.getRequestStats();
      const cacheStats = await jobCache.getCacheStats();
      
      return {
        requests: requestStats,
        cache: cacheStats,
        hasApiKey: !!this.RAPIDAPI_KEY,
      };
    }
    return null;
  }

  /**
   * Admin-only: Clear all cached data for maintenance
   */
  async _clearCacheAdmin() {
    if (__DEV__) {
      await jobCache.clearCache();
      console.log('[ADMIN] Cache cleared by admin');
    }
  }

  /**
   * Format location parameter for better API compatibility
   */
  private formatLocationForApi(location?: string): string | undefined {
    if (!location) return undefined;
    
    // Clean up the location string
    let formatted = location.trim();
    
    // If it looks like "City, State" format, keep it as is
    if (formatted.includes(',')) {
      return formatted;
    }
    
    // If it's just a city name, try to make it more specific
    // This helps the API understand what we're looking for
    return formatted;
  }

  /**
   * Filter jobs by location using client-side matching
   * This ensures we only return jobs from the requested location
   */
  private filterJobsByLocation(jobs: Job[], requestedLocation: string): Job[] {
    if (!requestedLocation.trim()) return jobs;

    const searchTerms = this.extractLocationSearchTerms(requestedLocation);
    
    return jobs.filter(job => {
      const jobLocation = job.location.toLowerCase();
      
      // Check if any of the search terms match the job location
      return searchTerms.some(term => {
        // Exact match or contains match
        return jobLocation.includes(term) || this.isLocationMatch(jobLocation, term);
      });
    });
  }

  /**
   * Extract search terms from the requested location
   */
  private extractLocationSearchTerms(location: string): string[] {
    const terms: string[] = [];
    const cleanLocation = location.toLowerCase().trim();
    
    // Add the full location
    terms.push(cleanLocation);
    
    // If location contains comma, split and add parts
    if (cleanLocation.includes(',')) {
      const parts = cleanLocation.split(',').map(part => part.trim());
      terms.push(...parts);
    }
    
    // Add common location variations
    const locationVariations = this.getLocationVariations(cleanLocation);
    terms.push(...locationVariations);
    
    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Get common variations of a location name
   */
  private getLocationVariations(location: string): string[] {
    const variations: string[] = [];
    
    // Common state abbreviations and full names
    const stateMap: { [key: string]: string[] } = {
      'california': ['ca', 'calif'],
      'ca': ['california', 'calif'],
      'new york': ['ny', 'new york state'],
      'ny': ['new york', 'new york state'],
      'texas': ['tx', 'tex'],
      'tx': ['texas', 'tex'],
      'florida': ['fl', 'fla'],
      'fl': ['florida', 'fla'],
      'illinois': ['il', 'ill'],
      'il': ['illinois', 'ill'],
      'pennsylvania': ['pa', 'penn'],
      'pa': ['pennsylvania', 'penn'],
      'ohio': ['oh'],
      'oh': ['ohio'],
      'michigan': ['mi', 'mich'],
      'mi': ['michigan', 'mich'],
      'georgia': ['ga'],
      'ga': ['georgia'],
      'north carolina': ['nc', 'n.c.'],
      'nc': ['north carolina', 'n.c.'],
      'virginia': ['va', 'virg'],
      'va': ['virginia', 'virg'],
      'washington': ['wa', 'wash'],
      'wa': ['washington', 'wash'],
      'massachusetts': ['ma', 'mass'],
      'ma': ['massachusetts', 'mass'],
      'arizona': ['az', 'ariz'],
      'az': ['arizona', 'ariz'],
      'colorado': ['co', 'colo'],
      'co': ['colorado', 'colo'],
      'nevada': ['nv', 'nev'],
      'nv': ['nevada', 'nev'],
    };

    // Check for state variations
    Object.entries(stateMap).forEach(([key, variants]) => {
      if (location.includes(key)) {
        variations.push(...variants);
      }
    });

    return variations;
  }

  /**
   * Check if two location strings match using fuzzy logic
   */
  private isLocationMatch(jobLocation: string, searchTerm: string): boolean {
    // Remove common words that might cause false matches
    const commonWords = ['the', 'of', 'and', 'or', 'in', 'at', 'to', 'for', 'with'];
    
    const cleanJobLocation = jobLocation
      .split(' ')
      .filter(word => !commonWords.includes(word))
      .join(' ');
    
    const cleanSearchTerm = searchTerm
      .split(' ')
      .filter(word => !commonWords.includes(word))
      .join(' ');
    
    // Check for partial matches (at least 3 characters)
    if (cleanSearchTerm.length >= 3) {
      return cleanJobLocation.includes(cleanSearchTerm);
    }
    
    return false;
  }
}

export const jobApiService = new JobApiService(); 