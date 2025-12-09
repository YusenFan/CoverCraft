import React from 'react';
import { ResumeAnalysisResult, ResumeSuggestion } from '../types';

interface SuggestionsPanelProps {
  result: ResumeAnalysisResult | null;
  selectedSuggestion: ResumeSuggestion | null;
  onSuggestionClick: (suggestion: ResumeSuggestion) => void;
}

const categoryIcons: Record<string, JSX.Element> = {
  skills: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  experience: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  education: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  ),
  summary: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  format: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  keywords: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
};

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const categoryColors: Record<string, string> = {
  skills: 'bg-purple-500',
  experience: 'bg-blue-500',
  education: 'bg-green-500',
  summary: 'bg-orange-500',
  format: 'bg-pink-500',
  keywords: 'bg-cyan-500',
};

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ 
  result, 
  selectedSuggestion, 
  onSuggestionClick 
}) => {
  if (!result) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-slate-500">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Score */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black">Analysis Results</h2>
          <div className="flex items-center gap-2">
            <div className={`text-2xl font-bold ${
              result.overallScore >= 70 ? 'text-emerald-600' :
              result.overallScore >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {result.overallScore}
            </div>
            <span className="text-xs text-slate-500">/100</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full transition-all duration-500 ${
              result.matchPercentage >= 70 ? 'bg-emerald-500' :
              result.matchPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${result.matchPercentage}%` }}
          />
        </div>

        {/* Strong Points */}
        {result.strongPoints && result.strongPoints.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Strong Points</h3>
            <div className="flex flex-wrap gap-1">
              {result.strongPoints.slice(0, 3).map((point, idx) => (
                <span key={idx} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  ✓ {point}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Keywords */}
        {result.missingKeywords && result.missingKeywords.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Missing Keywords</h3>
            <div className="flex flex-wrap gap-1">
              {result.missingKeywords.slice(0, 6).map((keyword, idx) => (
                <span key={idx} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200">
                  + {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Improvement Suggestions ({result.suggestions.length})
        </h3>
        
        <div className="space-y-3">
          {result.suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSuggestionClick(suggestion)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                selectedSuggestion?.id === suggestion.id 
                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg text-white ${categoryColors[suggestion.category] || 'bg-slate-500'}`}>
                  {categoryIcons[suggestion.category] || categoryIcons.summary}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-black text-sm truncate">{suggestion.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${priorityColors[suggestion.priority]}`}>
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{suggestion.suggestion}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 flex-shrink-0 transition-transform ${
                  selectedSuggestion?.id === suggestion.id ? 'text-emerald-500 rotate-90' : 'text-slate-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestionsPanel;

