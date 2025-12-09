export enum Tone {
  PROFESSIONAL = 'Professional',
  ENTHUSIASTIC = 'Enthusiastic',
  CONFIDENT = 'Confident',
  CASUAL = 'Casual/Startup',
  ACADEMIC = 'Academic',
}

export enum Length {
  SHORT = 'Concise (200 words)',
  MEDIUM = 'Standard (350 words)',
  LONG = 'Detailed (500 words)',
}

export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  CHINESE = 'Mandarin Chinese',
}

export interface CoverLetterState {
  fullName: string;
  companyName: string;
  jobTitle: string;
  jobLink?: string; // New field for job URL
  resumeText: string;
  resumeData?: string; // Base64 encoded string for PDF
  resumeMimeType?: string; // Mime type for uploaded file
  tone: Tone;
  length: Length;
  language: Language;
  additionalInstructions: string;
}

export interface GeneratedResult {
  text: string;
  sources?: { title: string; uri: string }[];
}

export enum AppStep {
  INPUTS = 0,
  PREVIEW = 1,
}

// Resume Optimizer Types
export interface ResumeSuggestion {
  id: string;
  category: 'skills' | 'experience' | 'education' | 'summary' | 'format' | 'keywords';
  title: string;
  suggestion: string;
  originalText?: string; // Text from resume that needs improvement
  improvedText?: string; // Suggested improved text
  priority: 'high' | 'medium' | 'low';
  lineReference?: { start: number; end: number }; // Line numbers in resume
}

export interface GlassdoorReview {
  companyRating: number; // 1-5 stars
  roleRating?: number; // 1-5 stars for specific role if available
  reviewSummary: string; // Brief review summary
  prosHighlights: string[]; // Top pros
  consHighlights: string[]; // Top cons
  glassdoorUrl: string; // Link to Glassdoor company page
}

// Company insights from Perplexity search
export interface CompanyInsights {
  companyName: string;
  companyRating?: number; // 1-5 stars if available
  reviewSummary: string; // Brief summary about the company
  prosHighlights: string[]; // Key positives
  consHighlights: string[]; // Key negatives/concerns
  sources: { title: string; url: string }[]; // Source links for verification
  searchQuery?: string; // The query used to search (for transparency)
}

// Single improvement point for a paragraph
export interface ImprovementPoint {
  id: string;
  suggestion: string; // What to improve
  priority: 'high' | 'medium' | 'low';
}

export interface ExperienceSuggestion {
  id: string;
  companyName: string; // Company name for this experience
  jobTitle: string; // Job title for this experience
  originalExperience: string; // Original job experience text from resume
  suggestion: string; // What to improve (for backwards compatibility)
  refinedParagraph: string; // The improved version
  priority: 'high' | 'medium' | 'low';
  improvements?: ImprovementPoint[]; // Multiple improvement points grouped together
}

export interface ResumeAnalysisResult {
  overallScore: number; // 0-100
  matchPercentage: number; // How well resume matches JD
  interviewProbability: number; // 0-100
  acceptanceProbability: number; // 0-100
  suggestions: ResumeSuggestion[];
  missingKeywords: string[];
  strongPoints: string[];
  glassdoorReview?: GlassdoorReview; // Glassdoor company review (legacy)
  companyInsights?: CompanyInsights; // Company insights from Perplexity
  experienceSuggestions?: ExperienceSuggestion[]; // Job experience focused suggestions
}

export interface ResumeOptimizerState {
  jobLink: string;
  jobDescription?: string; // Optional manual JD input
  resumeText: string;
  resumeData?: string;
  resumeMimeType?: string;
}