import { Tone, Length, Language } from './types';

export const INITIAL_STATE = {
  fullName: '',
  companyName: '',
  jobTitle: '',
  jobLink: '',
  resumeText: '',
  resumeData: undefined,
  resumeMimeType: undefined,
  tone: Tone.PROFESSIONAL,
  length: Length.MEDIUM,
  language: Language.ENGLISH,
  additionalInstructions: '',
};

export const SAMPLE_RESUME_PLACEHOLDER = `Jane Doe
Software Engineer
...
Experience:
- Senior Developer at TechCorp (2019-Present)
- ...
`;