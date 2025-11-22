import React, { useRef, useEffect, useState } from 'react';
import { GeneratedResult } from '../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface PreviewPanelProps {
  result: GeneratedResult | null;
  isGenerating: boolean;
  lastUpdated: Date | null;
  onContentChange: (newContent: string) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ result, isGenerating, lastUpdated, onContentChange }) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Update content editable when result changes from API
  useEffect(() => {
    if (contentEditableRef.current && result?.text) {
       contentEditableRef.current.innerText = result.text;
    }
  }, [result?.text]);

  const handleDownload = () => {
    if (!paperRef.current) {
        // Fallback
        window.print();
        return;
    }

    setIsDownloading(true);
    const element = paperRef.current;
    
    // Configuration for html2pdf
    const opt = {
      margin:       [0, 0, 0, 0], // No margin here, handled by padding in the div
      filename:     'cover-letter.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        setIsDownloading(false);
    }).catch((err: any) => {
        console.error("PDF generation failed", err);
        setIsDownloading(false);
        alert("Direct download failed. Opening print dialog instead.");
        window.print();
    });
  };

  if (!result && !isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white text-black p-10 text-center">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-black">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-black mb-3">Ready to write</h3>
        <p className="max-w-md text-slate-600 font-medium">Fill in your details on the left and click Generate. I'll research the company and write a perfect letter for you.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white relative overflow-hidden">
      {/* Toolbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 no-print flex-shrink-0">
        <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 font-medium">
                {isGenerating ? "Generating..." : lastUpdated ? `Generated at ${lastUpdated.toLocaleTimeString()}` : ""}
            </span>
        </div>
        <div className="flex items-center gap-3">
            {result?.sources && result.sources.length > 0 && (
                <div className="group relative">
                    <button className="text-xs text-black bg-slate-100 px-3 py-1.5 rounded-full font-bold border border-slate-300 hover:bg-slate-200 transition-colors">
                       {result.sources.length} Sources Used
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-black p-3 hidden group-hover:block z-20">
                        <h4 className="text-xs font-bold text-black mb-2">Information Sources</h4>
                        <ul className="space-y-2">
                            {result.sources.map((source, idx) => (
                                <li key={idx} className="text-xs truncate">
                                    <a href={source.uri} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block truncate font-medium">
                                        {source.title || "Web Source"}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            <button 
                onClick={handleDownload}
                disabled={!result || isDownloading}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors border border-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isDownloading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12 flex justify-center bg-slate-100 items-start">
         <div 
             ref={paperRef}
             id="cover-letter-content"
             style={{
               // A4 dimensions: 210mm x 297mm
               // We use repeating linear gradient to simulate page breaks visually
               backgroundImage: 'repeating-linear-gradient(to bottom, white 0px, white calc(297mm - 1px), #e2e8f0 calc(297mm - 1px), #e2e8f0 297mm)',
               backgroundSize: '100% 297mm'
             }}
             className={`
            print-container w-full max-w-[21cm] shadow-2xl p-[2.5cm] min-h-[29.7cm] h-auto
            ${isGenerating ? 'opacity-50' : 'opacity-100'}
            bg-white text-black
         `}>
            {isGenerating ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-8"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-12"></div>
                    <div className="space-y-3">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                    </div>
                    <div className="space-y-3 mt-8">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-11/12"></div>
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                    </div>
                </div>
            ) : (
                <div 
                    ref={contentEditableRef}
                    contentEditable 
                    suppressContentEditableWarning
                    onBlur={(e) => onContentChange(e.currentTarget.innerText)}
                    className="font-serif text-black leading-loose whitespace-pre-wrap break-words outline-none focus:bg-slate-50/50 rounded text-[11pt] md:text-[12pt]"
                >
                    {/* Content injected via ref/useEffect initially, but maintained by DOM for editing */}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default PreviewPanel;