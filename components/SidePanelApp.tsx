import React, { useState, useCallback, useEffect, useRef } from 'react';
import { INITIAL_STATE } from '../constants';
import { CoverLetterState, GeneratedResult, ExtractedJobData, Tone, Length, Language } from '../types';
import { generateCoverLetter } from '../services/openaiService';
import { storageService } from '../services/storageService';
// @ts-ignore
import * as mammoth from 'mammoth';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import html2pdf from 'html2pdf.js';

type ViewState = 'input' | 'preview';

const SidePanelApp: React.FC = () => {
  const [formData, setFormData] = useState<CoverLetterState>(INITIAL_STATE);
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [view, setView] = useState<ViewState>('input');
  const [extractedJob, setExtractedJob] = useState<ExtractedJobData | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const contentEditableRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  // Load extracted job data from storage
  useEffect(() => {
    const loadExtractedJob = async () => {
      setIsDetecting(true);
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const data = await chrome.storage.local.get(['extractedJob', 'extractedAt']);
          if (data.extractedJob) {
            setExtractedJob(data.extractedJob);
            // Auto-fill form data from extracted job
            setFormData(prev => ({
              ...prev,
              companyName: data.extractedJob.companyName || prev.companyName,
              jobTitle: data.extractedJob.jobTitle || prev.jobTitle,
              jobLink: data.extractedJob.jobUrl || prev.jobLink,
              jobDescription: data.extractedJob.jobDescription || prev.jobDescription,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load extracted job:', error);
      } finally {
        setIsDetecting(false);
      }
    };

    loadExtractedJob();

    // Listen for storage changes
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const listener = (changes: any) => {
        if (changes.extractedJob?.newValue) {
          setExtractedJob(changes.extractedJob.newValue);
          setFormData(prev => ({
            ...prev,
            companyName: changes.extractedJob.newValue.companyName || prev.companyName,
            jobTitle: changes.extractedJob.newValue.jobTitle || prev.jobTitle,
            jobLink: changes.extractedJob.newValue.jobUrl || prev.jobLink,
            jobDescription: changes.extractedJob.newValue.jobDescription || prev.jobDescription,
          }));
        }
      };
      chrome.storage.local.onChanged.addListener(listener);
      return () => chrome.storage.local.onChanged.removeListener(listener);
    }
  }, []);

  // Load saved preferences
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const prefs = await storageService.loadPreferences();
        setFormData(prev => ({
          ...prev,
          language: prefs.language || prev.language,
          tone: prefs.tone || prev.tone,
          length: prefs.length || prev.length,
        }));
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    loadSavedData();
  }, []);

  const handleInputChange = useCallback((field: keyof CoverLetterState, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'language' || field === 'tone' || field === 'length') {
        storageService.savePreferences({
          language: field === 'language' ? value : prev.language,
          tone: field === 'tone' ? value : prev.tone,
          length: field === 'length' ? value : prev.length,
        });
      }
      return updated;
    });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessingFile(true);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        try {
          // Use local worker file for Chrome extension
          if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.js');
          } else {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          }
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
          }
          handleInputChange('resumeText', fullText.trim());
        } catch (err) {
          console.error("PDF parse error", err);
          alert("Could not parse PDF. Please try another file.");
          setFileName(null);
        }
      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          handleInputChange('resumeText', result.value);
        } catch (err) {
          console.error("DOCX parse error", err);
          alert("Could not parse DOCX. Please try another file.");
          setFileName(null);
        }
      } else if (file.name.endsWith('.doc')) {
        alert(".doc files are not supported. Please use .docx or .pdf");
        setFileName(null);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            handleInputChange('resumeText', event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const refreshJobDetails = async () => {
    setIsDetecting(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        await chrome.runtime.sendMessage({ type: 'REFRESH_JOB_DETAILS' });
        // Wait a bit for the extraction to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        const data = await chrome.storage.local.get(['extractedJob']);
        if (data.extractedJob) {
          setExtractedJob(data.extractedJob);
          setFormData(prev => ({
            ...prev,
            companyName: data.extractedJob.companyName || prev.companyName,
            jobTitle: data.extractedJob.jobTitle || prev.jobTitle,
            jobLink: data.extractedJob.jobUrl || prev.jobLink,
            jobDescription: data.extractedJob.jobDescription || prev.jobDescription,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to refresh job details:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateCoverLetter(formData);
      setGeneratedResult(result);
      setView('preview');

      if (result.text) {
        await storageService.addToHistory({
          companyName: formData.companyName,
          jobTitle: formData.jobTitle,
          content: result.text,
        });
      }
    } catch (error) {
      alert("Error generating letter. Please try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [formData]);

  const handleContentChange = useCallback((newText: string) => {
    setGeneratedResult(prev => prev ? { ...prev, text: newText } : null);
  }, []);

  const handleDownload = () => {
    if (!paperRef.current) {
      window.print();
      return;
    }

    setIsDownloading(true);
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `cover-letter-${formData.companyName || 'draft'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(paperRef.current).save().then(() => {
      setIsDownloading(false);
    }).catch((err: any) => {
      console.error("PDF generation failed", err);
      setIsDownloading(false);
      window.print();
    });
  };

  useEffect(() => {
    if (contentEditableRef.current && generatedResult?.text) {
      contentEditableRef.current.innerText = generatedResult.text;
    }
  }, [generatedResult?.text]);

  const hasResume = !!formData.resumeText;
  const hasJobInfo = !!(formData.companyName || formData.jobTitle || formData.jobDescription);
  const canGenerate = hasResume && hasJobInfo && !isGenerating && !isProcessingFile;

  // Input View
  if (view === 'input') {
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white p-1 rounded text-sm font-bold">CC</span>
            <span className="font-bold text-lg">CoverCraft</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Job Detection Card */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Detected Job</span>
                <button
                  onClick={refreshJobDetails}
                  disabled={isDetecting}
                  className="text-xs text-slate-500 hover:text-black flex items-center gap-1"
                >
                  <svg className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {isDetecting ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Scanning page...
                </div>
              ) : extractedJob ? (
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-black truncate">{extractedJob.jobTitle || 'Unknown Position'}</p>
                  <p className="text-sm text-slate-600 truncate">{extractedJob.companyName || 'Unknown Company'}</p>
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Auto-detected from {extractedJob.source}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">No job detected. Open a job posting page or enter manually.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Company"
                      className="p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-black outline-none"
                    />
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      placeholder="Position"
                      className="p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-black outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your Resume</span>
              <label className={`cursor-pointer block p-4 border-2 border-dashed rounded-lg text-center transition-all ${
                fileName && formData.resumeText
                  ? 'border-green-400 bg-green-50'
                  : 'border-slate-300 hover:border-black hover:bg-slate-50'
              } ${isProcessingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                {isProcessingFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="text-sm text-slate-500">Processing...</span>
                  </div>
                ) : fileName && formData.resumeText ? (
                  <div className="space-y-1">
                    <svg className="w-8 h-8 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-green-700">{fileName}</p>
                    <p className="text-xs text-green-600">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-slate-700">Upload Resume</p>
                    <p className="text-xs text-slate-500">PDF, DOCX, or TXT</p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessingFile}
                />
              </label>
            </div>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between p-2 text-sm text-slate-600 hover:text-black transition-colors"
            >
              <span className="font-medium">Settings</span>
              <svg className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Collapsible Settings */}
            {showSettings && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Auto-extract from resume"
                    className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-black outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tone</label>
                    <select
                      value={formData.tone}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-black outline-none bg-white"
                    >
                      {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Length</label>
                    <select
                      value={formData.length}
                      onChange={(e) => handleInputChange('length', e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-black outline-none bg-white"
                    >
                      {Object.values(Length).map(l => <option key={l} value={l}>{l.split(' ')[0]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-black outline-none bg-white"
                    >
                      {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Custom Instructions</label>
                  <textarea
                    value={formData.additionalInstructions}
                    onChange={(e) => handleInputChange('additionalInstructions', e.target.value)}
                    placeholder="e.g., Emphasize leadership skills..."
                    className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-black outline-none resize-none h-16"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${
              canGenerate
                ? 'bg-black hover:bg-slate-800 active:scale-[0.98]'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Cover Letter
              </>
            )}
          </button>
          {!canGenerate && !isGenerating && (
            <p className="text-xs text-center text-slate-500 mt-2">
              {!hasResume ? 'Upload your resume to continue' : !hasJobInfo ? 'Job info needed' : ''}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Preview View
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
        <button
          onClick={() => setView('input')}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-black"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span className="font-bold text-sm">Preview & Edit</span>
        <div className="w-12"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
        <div
          ref={paperRef}
          className="bg-white rounded-lg shadow-lg p-6 min-h-[400px]"
        >
          {isGenerating ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-full mt-6"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-full mt-4"></div>
              <div className="h-4 bg-slate-200 rounded w-11/12"></div>
              <div className="h-4 bg-slate-200 rounded w-4/5"></div>
            </div>
          ) : (
            <div
              ref={contentEditableRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleContentChange(e.currentTarget.innerText)}
              className="font-serif text-sm leading-relaxed whitespace-pre-wrap outline-none focus:bg-slate-50/50 min-h-[300px]"
            />
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-2">
        <button
          onClick={handleDownload}
          disabled={!generatedResult || isDownloading}
          className="w-full py-3 bg-black text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </>
          )}
        </button>
        <button
          onClick={() => setView('input')}
          className="w-full py-2 text-sm text-slate-600 hover:text-black transition-colors"
        >
          Generate New
        </button>
      </div>
    </div>
  );
};

export default SidePanelApp;
