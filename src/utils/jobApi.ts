import axios from 'axios';
import { Job, JobSearchParams, JobSearchResponse, ResumeAnalysis } from '../types/job';
import { CONFIG } from './config';
import { jobCache } from './jobCache';

/**
 * Job API service for fetching job data
 * Integrates with Indeed API and provides fallback mock data
 */
class JobApiService {
  private readonly RAPIDAPI_KEY = CONFIG.RAPIDAPI_KEY;
  private readonly RAPIDAPI_URL = CONFIG.RAPIDAPI_URL;

  /**
   * Search for jobs using JSearch API with smart caching
   */
  async searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
    try {
      // Check cache first
      const cachedJobs = await jobCache.getCachedJobs(params);
      if (cachedJobs) {
        return {
          jobs: cachedJobs,
          total: cachedJobs.length,
          page: 1,
          hasMore: false,
        };
      }

      // Check if we can make an API request
      const { canMakeRequest } = await jobCache.trackRequest();
      
      if (!canMakeRequest) {
        return this.getMockJobs(params);
      }

      // Try RapidAPI JSearch
      if (this.RAPIDAPI_KEY) {
        const response = await this.searchRapidApiJobs(params);
        
        // Cache the results
        await jobCache.cacheJobs(params, response.jobs, response.total);
        
        return response;
      }
      
      // Fallback to mock data
      return this.getMockJobs(params);
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      return this.getMockJobs(params);
    }
  }

  /**
   * Search jobs using RapidAPI JSearch
   */
  private async searchRapidApiJobs(params: JobSearchParams): Promise<JobSearchResponse> {
    const response = await axios.get(`${this.RAPIDAPI_URL}/search`, {
      headers: {
        'X-RapidAPI-Key': this.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      },
      params: {
        query: params.query,
        location: params.location,
        num_pages: 1,
        page: 1
      }
    });

    return this.transformRapidApiResponse(response.data);
  }



  /**
   * Transform RapidAPI response to our format
   */
  private transformRapidApiResponse(data: any): JobSearchResponse {
    const jobs: Job[] = data.data?.map((job: any, index: number) => ({
      id: job.job_id || `rapid-${index}`,
      title: job.job_title || '',
      company: job.employer_name || '',
      location: job.job_city || '',
      salary: job.job_salary || '',
      matchRate: this.calculateMatchRate(job),
      postedDate: job.job_posted_at_datetime_utc || '',
      description: job.job_description || '',
      requirements: this.extractRequirements(job.job_description || ''),
      jobType: job.job_employment_type || 'full-time',
      experienceLevel: this.determineExperienceLevel(job.job_title || ''),
      remote: job.job_is_remote || false,
      url: job.job_apply_link || '',
      companyInfo: {
        name: job.employer_name || '',
        logo: job.employer_logo
      }
    })) || [];

    return {
      jobs,
      total: data.total || jobs.length,
      page: 1,
      hasMore: jobs.length >= 20
    };
  }

  /**
   * Get mock job data for development
   */
  private getMockJobs(params: JobSearchParams): JobSearchResponse {
    const mockJobs: Job[] = [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        salary: '$120,000 - $150,000',
        salary_min: 120000,
        salary_max: 150000,
        salary_currency: 'USD',
        matchRate: 95,
        postedDate: '2 days ago',
        description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing high-quality software solutions and mentoring junior developers.',
        requirements: [
          '5+ years of experience in software development',
          'Strong knowledge of React Native and TypeScript',
          'Experience with mobile app development',
          'Excellent problem-solving skills',
          'Strong communication and teamwork abilities',
        ],
        responsibilities: [
          'Develop and maintain mobile applications',
          'Collaborate with cross-functional teams',
          'Mentor junior developers',
          'Participate in code reviews',
          'Contribute to technical architecture decisions',
        ],
        benefits: [
          'Competitive salary and equity',
          'Health, dental, and vision insurance',
          'Flexible work hours and remote options',
          'Professional development opportunities',
          'Team events and activities',
        ],
        jobType: 'full-time',
        experienceLevel: 'senior',
        remote: false,
        companyInfo: {
          name: 'TechCorp Inc.',
          size: '100-500 employees',
          industry: 'Technology',
          description: 'TechCorp is a leading technology company focused on innovative mobile solutions.',
        },
      },
      {
        id: '2',
        title: 'Mobile App Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        salary: '$90,000 - $110,000',
        salary_min: 90000,
        salary_max: 110000,
        salary_currency: 'USD',
        matchRate: 88,
        postedDate: '1 day ago',
        description: 'Join our innovative team building the next generation of mobile apps. We are looking for a talented Mobile App Developer with experience in React Native.',
        requirements: [
          'React Native development experience',
          'TypeScript proficiency',
          '3+ years of mobile development',
          'Experience with Expo framework',
          'Knowledge of mobile UI/UX principles',
        ],
        jobType: 'full-time',
        experienceLevel: 'mid',
        remote: true,
        companyInfo: {
          name: 'StartupXYZ',
          size: '10-50 employees',
          industry: 'Technology',
        },
      },
      {
        id: '3',
        title: 'Full Stack Developer',
        company: 'Enterprise Solutions',
        location: 'New York, NY',
        salary: '$100,000 - $130,000',
        salary_min: 100000,
        salary_max: 130000,
        salary_currency: 'USD',
        matchRate: 82,
        postedDate: '3 days ago',
        description: 'Looking for a talented Full Stack Developer to work on exciting projects. You will be responsible for both frontend and backend development.',
        requirements: [
          'React and Node.js experience',
          'Database design and management',
          '4+ years of full-stack development',
          'API design and implementation',
          'Cloud platform experience (AWS/Azure)',
        ],
        jobType: 'full-time',
        experienceLevel: 'mid',
        remote: false,
        companyInfo: {
          name: 'Enterprise Solutions',
          size: '500+ employees',
          industry: 'Technology',
        },
      },
      {
        id: '4',
        title: 'React Native Developer',
        company: 'MobileFirst',
        location: 'Austin, TX',
        salary: '$85,000 - $105,000',
        salary_min: 85000,
        salary_max: 105000,
        salary_currency: 'USD',
        matchRate: 90,
        postedDate: '5 days ago',
        description: 'Join our mobile development team to create amazing user experiences. We focus on React Native and cross-platform development.',
        requirements: [
          'React Native expertise',
          'JavaScript/TypeScript skills',
          'Mobile app deployment experience',
          'UI/UX design understanding',
          'Git and version control',
        ],
        jobType: 'full-time',
        experienceLevel: 'mid',
        remote: false,
        companyInfo: {
          name: 'MobileFirst',
          size: '50-200 employees',
          industry: 'Technology',
        },
      },
      {
        id: '5',
        title: 'Senior Mobile Engineer',
        company: 'Innovation Labs',
        location: 'Seattle, WA',
        salary: '$130,000 - $160,000',
        salary_min: 130000,
        salary_max: 160000,
        salary_currency: 'USD',
        matchRate: 92,
        postedDate: '1 week ago',
        description: 'Lead mobile development initiatives and mentor junior developers. Work on cutting-edge mobile technologies.',
        requirements: [
          '7+ years of mobile development',
          'React Native and native iOS/Android',
          'Team leadership experience',
          'Architecture design skills',
          'Performance optimization expertise',
        ],
        jobType: 'full-time',
        experienceLevel: 'senior',
        remote: true,
        companyInfo: {
          name: 'Innovation Labs',
          size: '200-500 employees',
          industry: 'Technology',
        },
      },
    ];

    // Filter jobs based on search params
    const filteredJobs = mockJobs.filter(job => {
      const matchesQuery = !params.query || 
        job.title.toLowerCase().includes(params.query.toLowerCase()) ||
        job.company.toLowerCase().includes(params.query.toLowerCase());
      
      const matchesLocation = !params.location || 
        job.location.toLowerCase().includes(params.location.toLowerCase());
      
      return matchesQuery && matchesLocation;
    });

    return {
      jobs: filteredJobs,
      total: filteredJobs.length,
      page: 1,
      hasMore: false
    };
  }

  /**
   * Calculate match rate based on job requirements and resume skills
   */
  private calculateMatchRate(job: any): number {
    // Mock calculation - in real app, this would analyze resume skills
    const baseRate = Math.floor(Math.random() * 30) + 70; // 70-100%
    return Math.min(baseRate, 100);
  }

  /**
   * Extract requirements from job description
   */
  private extractRequirements(description: string): string[] {
    const requirements = [
      'React Native experience',
      'TypeScript proficiency',
      'Mobile development skills',
      'Problem-solving abilities',
      'Team collaboration',
    ];
    return requirements.slice(0, Math.floor(Math.random() * 3) + 2);
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
}

export const jobApiService = new JobApiService(); 