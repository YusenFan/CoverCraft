import React, { useState } from 'react';
import { ResumeAnalysisResult } from '../types';

interface AnalysisResultsProps {
  result: ResumeAnalysisResult;
}

const categoryIcons: Record<string, JSX.Element> = {
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

// Score card with hover popover for strong points
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
      className="relative bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-md hover:border-emerald-200"
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <div className={`text-3xl font-bold mb-1 ${colorClass}`}>
        {score}%
      </div>
      <div className="text-sm text-slate-500 font-medium">{title}</div>
      
      {/* Strong Points Popover */}
      {showPopover && strongPoints && strongPoints.length > 0 && (
        <div className="absolute z-50 top-full mt-2 left-1/2 transform -translate-x-1/2 w-80 bg-white rounded-xl shadow-2xl border border-emerald-100 p-4 animate-fadeIn">
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
  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
    <div className={`text-3xl font-bold mb-1 ${colorClass}`}>
      {score}%
    </div>
    <div className="text-sm text-slate-500 font-medium">{title}</div>
  </div>
);

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
              Copy to Clipboard
            </>
          )}
        </button>
      </div>
      <textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        className="w-full min-h-[120px] p-3 text-sm text-slate-800 bg-white rounded-lg border border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none resize-y font-mono leading-relaxed"
        placeholder="Edit your refined experience here..."
      />
    </div>
  );
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result }) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 p-6 space-y-6 overflow-y-auto">
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

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard 
          title="Overall Score" 
          score={result.overallScore} 
          colorClass={getScoreColor(result.overallScore)} 
        />
        <ScoreCardWithPopover 
          title="Match Score" 
          score={result.matchPercentage} 
          colorClass={getScoreColor(result.matchPercentage)}
          strongPoints={result.strongPoints}
        />
        <ScoreCard 
          title="Interview Chance" 
          score={result.interviewProbability || 0} 
          colorClass={getScoreColor(result.interviewProbability || 0)} 
        />
        <ScoreCard 
          title="Acceptance Chance" 
          score={result.acceptanceProbability || 0} 
          colorClass={getScoreColor(result.acceptanceProbability || 0)} 
        />
      </div>

      {/* Glassdoor Review Section */}
      {result.glassdoorReview && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Glassdoor Company Review</h3>
                  <p className="text-emerald-100 text-sm">Employee insights & ratings</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <span className="text-xs text-emerald-200 uppercase tracking-wider">Company Rating</span>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={result.glassdoorReview.companyRating} />
                  </div>
                </div>
                {result.glassdoorReview.roleRating && (
                  <div>
                    <span className="text-xs text-emerald-200 uppercase tracking-wider">Role Rating</span>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={result.glassdoorReview.roleRating} />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-emerald-50 leading-relaxed mb-4">
                {result.glassdoorReview.reviewSummary}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pros
                  </h4>
                  <ul className="space-y-1">
                    {result.glassdoorReview.prosHighlights.map((pro, idx) => (
                      <li key={idx} className="text-sm text-emerald-50 flex items-start gap-2">
                        <span className="text-emerald-300">+</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Cons
                  </h4>
                  <ul className="space-y-1">
                    {result.glassdoorReview.consHighlights.map((con, idx) => (
                      <li key={idx} className="text-sm text-emerald-50 flex items-start gap-2">
                        <span className="text-red-300">−</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <a 
                href={result.glassdoorReview.glassdoorUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Glassdoor
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Experience Suggestions Section */}
          {result.experienceSuggestions && result.experienceSuggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Job Experience Improvements
                </h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                  {result.experienceSuggestions.length} Experience{result.experienceSuggestions.length > 1 ? 's' : ''}
                </span>
              </div>

              {result.experienceSuggestions.map((expSuggestion) => (
                <div 
                  key={expSuggestion.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                      expSuggestion.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                      expSuggestion.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {expSuggestion.priority} priority
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Original Experience</span>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap font-mono">
                      {expSuggestion.originalExperience}
                    </p>
                  </div>

                  <p className="text-slate-700 mb-2 leading-relaxed">
                    <span className="font-semibold text-slate-800">Suggestion:</span> {expSuggestion.suggestion}
                  </p>

                  <EditableRefinedText 
                    text={expSuggestion.refinedParagraph} 
                    suggestionId={expSuggestion.id} 
                  />
                </div>
              ))}
            </div>
          )}

          {/* Other Suggestions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Other Action Items & Suggestions</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                {result.suggestions.length} Items found
              </span>
            </div>

            <div className="space-y-4">
              {result.suggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl text-white flex-shrink-0 ${categoryColors[suggestion.category] || 'bg-slate-500'}`}>
                      {categoryIcons[suggestion.category] || categoryIcons.summary}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-slate-800">{suggestion.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                          suggestion.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                          suggestion.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {suggestion.priority} priority
                        </span>
                      </div>
                      
                      <p className="text-slate-600 mb-4 leading-relaxed">
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
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
