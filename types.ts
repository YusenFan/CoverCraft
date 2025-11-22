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
  jobLink?: string; // Job URL
  jobDescription?: string; // Auto-extracted job description
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

export interface ExtractedJobData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  jobUrl: string;
  source: string;
}

export interface JobDetectionState {
  isDetecting: boolean;
  detected: ExtractedJobData | null;
  error: string | null;
}