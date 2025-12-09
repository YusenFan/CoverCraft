import React, { useRef, useEffect, useMemo } from 'react';
import { ResumeSuggestion, ResumeAnalysisResult } from '../types';

interface ResumeViewerProps {
  resumeText: string;
  selectedSuggestion: ResumeSuggestion | null;
  analysisResult: ResumeAnalysisResult | null;
}

const ResumeViewer: React.FC<ResumeViewerProps> = ({ 
  resumeText, 
  selectedSuggestion,
  analysisResult 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);

  // Scroll to highlighted text when suggestion changes
  useEffect(() => {
    if (highlightRef.current && selectedSuggestion?.originalText) {
      highlightRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [selectedSuggestion]);

  // Parse resume text and highlight matching sections
  const renderContent = useMemo(() => {
    if (!resumeText) return null;

    // If there's a selected suggestion with original text, highlight it
    if (selectedSuggestion?.originalText) {
      const originalText = selectedSuggestion.originalText;
      const index = resumeText.toLowerCase().indexOf(originalText.toLowerCase());
      
      if (index !== -1) {
        const before = resumeText.slice(0, index);
        const match = resumeText.slice(index, index + originalText.length);
        const after = resumeText.slice(index + originalText.length);

        return (
          <>
            <span className="whitespace-pre-wrap">{before}</span>
            <span 
              ref={highlightRef}
              className="bg-amber-200 text-amber-900 px-1 rounded border-2 border-amber-400 whitespace-pre-wrap"
            >
              {match}
            </span>
            <span className="whitespace-pre-wrap">{after}</span>
          </>
        );
      }
    }

    // Default: render plain text with keyword highlighting
    let content = resumeText;
    
    // Highlight missing keywords in the resume if present
    if (analysisResult?.missingKeywords && analysisResult.missingKeywords.length > 0) {
      // For missing keywords, we won't find them in the resume (that's why they're missing)
      // Instead, just show the plain text
      return <span className="whitespace-pre-wrap">{content}</span>;
    }

    return <span className="whitespace-pre-wrap">{content}</span>;
  }, [resumeText, selectedSuggestion, analysisResult]);

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
        <span className="text-sm font-medium text-slate-700">Your Resume</span>
        {selectedSuggestion && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
            Viewing: {selectedSuggestion.title}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Resume Document */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div 
            ref={contentRef}
            className="w-full max-w-[21cm] bg-white shadow-xl rounded-lg p-8 min-h-[29.7cm]"
          >
            <div className="font-mono text-sm text-slate-800 leading-relaxed">
              {renderContent}
            </div>
          </div>
        </div>

        {/* Suggestion Detail Panel */}
        {selectedSuggestion && (
          <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0">
            <div className="p-6 space-y-6">
              <div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase mb-3 ${
                  selectedSuggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                  selectedSuggestion.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedSuggestion.priority} priority
                </div>
                <h3 className="text-lg font-bold text-black mb-2">{selectedSuggestion.title}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded capitalize">
                  {selectedSuggestion.category}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suggestion</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedSuggestion.suggestion}</p>
              </div>

              {selectedSuggestion.originalText && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Text</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-mono">{selectedSuggestion.originalText}</p>
                  </div>
                </div>
              )}

              {selectedSuggestion.improvedText && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suggested Improvement</h4>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-sm text-emerald-800 font-mono">{selectedSuggestion.improvedText}</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedSuggestion.improvedText || '');
                    }}
                    className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy to clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeViewer;

