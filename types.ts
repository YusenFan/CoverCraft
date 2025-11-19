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