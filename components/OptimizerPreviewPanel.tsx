import React, { useState } from 'react';
import { ResumeAnalysisResult, CompanyInsights, ExperienceSuggestion, ImprovementPoint } from '../types';

interface OptimizerPreviewPanelProps {
  result: ResumeAnalysisResult | null;
  isAnalyzing: boolean;
  lastUpdated: Date | null;
  onReset: () => void;
}

const categoryIcons: Record<string, React.ReactElement> = {
  skills: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  experience: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  education: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  ),
  summary: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  format: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  keywords: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
};

const categoryColors: Record<string, string> = {
  skills: 'bg-purple-500',
  experience: 'bg-blue-500',
  education: 'bg-green-500',
  summary: 'bg-orange-500',
  format: 'bg-pink-500',
  keywords: 'bg-cyan-500',
};

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-medium text-slate-600">{rating.toFixed(1)}</span>
    </div>
  );
};

// Editable text field for experience suggestions
const EditableRefinedText = ({ 
  text, 
  suggestionId 
}: { 
  text: string; 
  suggestionId: string;
}) => {
  const [editedText, setEditedText] = useState(text);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Refined Version (Editable)
        </span>
        <button 
          onClick={handleCopy}
          className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            copied 
              ? 'bg-emerald-600 text-white' 
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        className="w-full min-h-[180px] p-4 text-sm text-slate-800 bg-white rounded-lg border border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none resize-y font-mono leading-relaxed"
        placeholder="Edit your refined experience here..."
      />
    </div>
  );
};

// Score card with hover popover
const ScoreCardWithPopover = ({ 
  title, 
  score, 
  colorClass, 
  strongPoints 
}: { 
  title: string; 
  score: number; 
  colorClass: string;
  strongPoints?: string[];
}) => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div 
      className="relative bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-md hover:border-emerald-200"
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <div className={`text-2xl font-bold mb-0.5 ${colorClass}`}>
        {score}%
      </div>
      <div className="text-xs text-slate-500 font-medium">{title}</div>
      
      {showPopover && strongPoints && strongPoints.length > 0 && (
        <div className="absolute z-50 top-full mt-2 left-1/2 transform -translate-x-1/2 w-72 bg-white rounded-xl shadow-2xl border border-emerald-100 p-4 animate-fadeIn">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-emerald-100 rotate-45"></div>
          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your Strong Points
          </h4>
          <ul className="space-y-2">
            {strongPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ScoreCard = ({ title, score, colorClass }: { title: string; score: number; colorClass: string }) => (
  <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
    <div className={`text-2xl font-bold mb-0.5 ${colorClass}`}>
      {score}%
    </div>
    <div className="text-xs text-slate-500 font-medium">{title}</div>
  </div>
);

// Company Insights Section (Perplexity-powered - placeholder for now)
const CompanyInsightsSection = ({ insights, glassdoorReview }: { 
  insights?: CompanyInsights; 
  glassdoorReview?: any; // Legacy support
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Use company insights if available, otherwise fall back to glassdoor data
  const hasInsights = insights || glassdoorReview;
  
  if (!hasInsights) {
    return (
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-5 border border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-slate-200 rounded-lg p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-700">Company Insights</h3>
            <p className="text-sm text-slate-500">Powered by AI search (coming soon)</p>
          </div>
        </div>
        <p className="text-slate-500 text-sm">Company insights will be available after Perplexity API is configured.</p>
      </div>
    );
  }

  // Use insights data or fall back to glassdoor
  const companyName = insights?.companyName || 'Company';
  const rating = insights?.companyRating || glassdoorReview?.companyRating;
  const summary = insights?.reviewSummary || glassdoorReview?.reviewSummary;
  const pros = insights?.prosHighlights || glassdoorReview?.prosHighlights || [];
  const cons = insights?.consHighlights || glassdoorReview?.consHighlights || [];
  const sources = insights?.sources || [];

  return (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-5 shadow-lg text-white">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold">{companyName} - Company Insights</h3>
          {rating && (
            <div className="flex items-center gap-4 mt-1">
              <StarRating rating={rating} />
            </div>
          )}
        </div>
       
      </div>
      
      {summary && (
        <p className="text-emerald-50 text-sm leading-relaxed mb-3">
          {summary}
        </p>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {pros.length > 0 && (
            <div className="bg-white/10 rounded-lg p-3">
              <h4 className="text-xs font-bold text-emerald-200 uppercase mb-2">Pros</h4>
              <ul className="space-y-1">
                {pros.slice(0, 3).map((pro: string, idx: number) => (
                  <li key={idx} className="text-xs text-emerald-50 flex items-start gap-1">
                    <span className="text-emerald-300">+</span> {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cons.length > 0 && (
            <div className="bg-white/10 rounded-lg p-3">
              <h4 className="text-xs font-bold text-emerald-200 uppercase mb-2">Cons</h4>
              <ul className="space-y-1">
                {cons.slice(0, 3).map((con: string, idx: number) => (
                  <li key={idx} className="text-xs text-emerald-50 flex items-start gap-1">
                    <span className="text-red-300">−</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sources Section - Easy to copy */}
      {sources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <h4 className="text-xs font-bold text-emerald-200 uppercase mb-2">Sources</h4>
          <div className="space-y-2">
            {sources.map((source, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                <span className="text-xs text-emerald-50 flex-1 truncate">{source.title}</span>
               
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] px-2 py-1 bg-white text-emerald-700 rounded font-bold hover:bg-emerald-50 transition-colors"
                >
                  Open
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Experience Suggestion Card with grouped improvements
interface ExperienceSuggestionCardProps {
  suggestion: ExperienceSuggestion;
}

const ExperienceSuggestionCard: React.FC<ExperienceSuggestionCardProps> = ({ suggestion }) => {
  const [isOriginalExpanded, setIsOriginalExpanded] = useState(false);
  
  // Combine the main suggestion with any grouped improvements
  const allImprovements: ImprovementPoint[] = suggestion.improvements || [
    { id: suggestion.id, suggestion: suggestion.suggestion, priority: suggestion.priority }
  ];

  // Get highest priority for the card
  const highestPriority = allImprovements.some(i => i.priority === 'high') ? 'high' :
                          allImprovements.some(i => i.priority === 'medium') ? 'medium' : 'low';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
      {/* Header with Company & Title */}
      <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">{suggestion.jobTitle || 'Job Position'}</h3>
              <p className="text-sm text-slate-500">{suggestion.companyName || 'Company'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
              highestPriority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
              highestPriority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-blue-50 text-blue-700 border-blue-100'
            }`}>
              {highestPriority} priority
            </span>
            {allImprovements.length > 1 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                {allImprovements.length} improvements
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Collapsible Original Text */}
        <div className="mb-4">
          <button 
            onClick={() => setIsOriginalExpanded(!isOriginalExpanded)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Original Experience
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 text-slate-400 transition-transform ${isOriginalExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isOriginalExpanded && (
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                {suggestion.originalExperience}
              </p>
            </div>
          )}
        </div>

        {/* All Improvements for this paragraph */}
        <div className="space-y-3 mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">What to Improve</span>
          {allImprovements.map((improvement, idx) => (
            <div 
              key={improvement.id} 
              className={`flex items-start gap-2 p-3 rounded-lg ${
                improvement.priority === 'high' ? 'bg-red-50 border border-red-100' :
                improvement.priority === 'medium' ? 'bg-amber-50 border border-amber-100' :
                'bg-blue-50 border border-blue-100'
              }`}
            >
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                improvement.priority === 'high' ? 'bg-red-200 text-red-800' :
                improvement.priority === 'medium' ? 'bg-amber-200 text-amber-800' :
                'bg-blue-200 text-blue-800'
              }`}>
                {idx + 1}
              </span>
              <p className="text-sm text-slate-700 flex-1">{improvement.suggestion}</p>
            </div>
          ))}
        </div>

        {/* Refined version with all improvements applied */}
        <EditableRefinedText 
          text={suggestion.refinedParagraph} 
          suggestionId={suggestion.id} 
        />
      </div>
    </div>
  );
};

const OptimizerPreviewPanel: React.FC<OptimizerPreviewPanelProps> = ({ 
  result, 
  isAnalyzing, 
  lastUpdated,
  onReset 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  // Empty state
  if (!result && !isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white text-black p-10 text-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-2 border-emerald-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-black mb-3">Ready to optimize</h3>
        <p className="max-w-md text-slate-600 font-medium">Upload your resume and provide a job description. I'll analyze the match and give you personalized suggestions to improve your chances.</p>
      </div>
    );
  }

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm z-10 flex-shrink-0">
          <span className="text-sm text-slate-600 font-medium">Analyzing your resume...</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">AI is analyzing your resume against the job requirements...</p>
            <p className="text-slate-400 text-sm mt-2">This may take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="h-full flex flex-col bg-white relative overflow-hidden">
      {/* Custom animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* Toolbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 no-print flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium">
            {lastUpdated ? `Analyzed at ${lastUpdated.toLocaleTimeString()}` : "Analysis Complete"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onReset}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New Crack
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ScoreCard 
              title="Overall" 
              score={result!.overallScore} 
              colorClass={getScoreColor(result!.overallScore)} 
            />
            <ScoreCardWithPopover 
              title="Match" 
              score={result!.matchPercentage} 
              colorClass={getScoreColor(result!.matchPercentage)}
              strongPoints={result!.strongPoints}
            />
            <ScoreCard 
              title="Interview" 
              score={result!.interviewProbability || 0} 
              colorClass={getScoreColor(result!.interviewProbability || 0)} 
            />
            <ScoreCard 
              title="Acceptance" 
              score={result!.acceptanceProbability || 0} 
              colorClass={getScoreColor(result!.acceptanceProbability || 0)} 
            />
          </div>

          {/* Missing Keywords */}
          {result!.missingKeywords && result!.missingKeywords.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Missing Keywords to Add</h3>
              <div className="flex flex-wrap gap-2">
                {result!.missingKeywords.map((keyword, idx) => (
                  <span key={idx} className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-200 font-medium">
                    + {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Company Insights Section */}
          <CompanyInsightsSection 
            insights={result!.companyInsights}
            glassdoorReview={result!.glassdoorReview}
          />

          {/* Experience Suggestions - Grouped by paragraph */}
          {result!.experienceSuggestions && result!.experienceSuggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Experience Improvements
                </h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {result!.experienceSuggestions.length} sections
                </span>
              </div>

              {result!.experienceSuggestions.map((expSuggestion) => (
                <ExperienceSuggestionCard key={expSuggestion.id} suggestion={expSuggestion} />
              ))}
            </div>
          )}

          {/* Other Suggestions */}
          {result!.suggestions && result!.suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Other Suggestions</h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {result!.suggestions.length}
                </span>
              </div>

              <div className="space-y-3">
                {result!.suggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id}
                    className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl text-white flex-shrink-0 ${categoryColors[suggestion.category] || 'bg-slate-500'}`}>
                        {categoryIcons[suggestion.category] || categoryIcons.summary}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-base text-slate-800">{suggestion.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            suggestion.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                            suggestion.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {suggestion.priority}
                          </span>
                        </div>
                        
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {suggestion.suggestion}
                        </p>

                        {suggestion.improvedText && (
                          <EditableRefinedText 
                            text={suggestion.improvedText} 
                            suggestionId={suggestion.id} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizerPreviewPanel;
