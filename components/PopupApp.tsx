import React, { useState, useCallback, useEffect } from 'react';
import { Language } from '../types';
import { storageService } from '../services/storageService';
// @ts-ignore
import * as mammoth from 'mammoth';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { jsPDF } from 'jspdf';

interface PageData {
  url: string;
  title: string;
  content: string;
}

const PopupApp: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isScraping, setIsScraping] = useState(true);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [status, setStatus] = useState<string>('');

  // Load saved language preference
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const prefs = await storageService.loadPreferences();
        if (prefs.language) {
          setLanguage(prefs.language as Language);
        }
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }
    };
    loadPrefs();
  }, []);

  // Scrape the current page on mount
  useEffect(() => {
    const scrapePage = async () => {
      setIsScraping(true);
      setScrapeError(null);

      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          const response = await chrome.runtime.sendMessage({ type: 'SCRAPE_PAGE' });
          if (response?.success && response.data) {
            setPageData(response.data);
          } else {
            setScrapeError(response?.error || 'Could not read page content');
          }
        } else {
          setScrapeError('Extension context not available');
        }
      } catch (error: any) {
        console.error('Scrape error:', error);
        setScrapeError(error.message || 'Failed to read page');
      } finally {
        setIsScraping(false);
      }
    };

    scrapePage();
  }, []);

  // Save language preference when changed
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    storageService.savePreferences({ language: newLang });
  };

  // Handle file upload (PDF, DOCX, DOC)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessingFile(true);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
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
          setResumeText(fullText.trim());
        } catch (err) {
          console.error('PDF parse error', err);
          alert('Could not parse PDF. Please try another file.');
          setFileName(null);
        }
      } else if (
        file.name.endsWith('.docx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          setResumeText(result.value);
        } catch (err) {
          console.error('DOCX parse error', err);
          alert('Could not parse DOCX. Please try another file.');
          setFileName(null);
        }
      } else if (file.name.endsWith('.doc')) {
        // .doc format is legacy and harder to parse client-side
        alert('.doc files are not fully supported. Please convert to .docx or .pdf for best results.');
        setFileName(null);
      } else {
        // Text files
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setResumeText(event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    } catch (e) {
      console.error(e);
      alert('Error processing file');
      setFileName(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Generate cover letter and download as PDF
  const handleGenerate = useCallback(async () => {
    if (!resumeText || !pageData) return;

    setIsGenerating(true);
    setStatus('Analyzing job posting...');

    try {
      // Call the API with page content and resume
      const response = await fetch('https://covercraft-ai-ivory.vercel.app/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: {
            resumeText,
            language,
            pageContent: pageData.content,
            pageUrl: pageData.url,
            pageTitle: pageData.title,
            // Use defaults for other fields - LLM will extract from page
            fullName: '',
            companyName: '',
            jobTitle: '',
            tone: 'Professional',
            length: 'Standard (350 words)',
            additionalInstructions: '',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const result = await response.json();
      const coverLetterText = result.text;

      if (!coverLetterText) {
        throw new Error('No content generated');
      }

      setStatus('Creating PDF...');

      // Use jsPDF directly to avoid html2canvas oklch color issues
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set font and margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 7;
      let yPosition = margin;

      doc.setFont('times', 'normal');
      doc.setFontSize(12);

      // Split text into lines that fit the page width
      const lines = doc.splitTextToSize(coverLetterText, maxWidth);

      // Add lines to PDF, creating new pages as needed
      for (const line of lines) {
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      }

      // Save the PDF
      doc.save(`cover-letter-${Date.now()}.pdf`);
      setStatus('PDF downloaded!');

      // Reset status after a moment
      setTimeout(() => setStatus(''), 2000);
    } catch (error: any) {
      console.error('Generate error:', error);
      setStatus('');
      alert(error.message || 'Error generating cover letter. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [resumeText, pageData, language]);

  const canGenerate = !!resumeText && !!pageData && !isGenerating && !isProcessingFile;

  return (
    <div className="w-[360px] min-h-[480px] flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white p-1.5 rounded text-sm font-bold">CC</span>
            <span className="font-bold text-lg">CoverCraft</span>
          </div>
          <a
            href="https://covercraft-ai-ivory.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            Open Full App
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Page Detection Status */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
            Current Page
          </span>
          {isScraping ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Reading page content...
            </div>
          ) : scrapeError ? (
            <div className="text-sm text-red-600">
              <p>{scrapeError}</p>
              <p className="text-xs mt-1 text-slate-500">Try refreshing the page or use the full app.</p>
            </div>
          ) : pageData ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-black truncate" title={pageData.title}>
                {pageData.title || 'Untitled Page'}
              </p>
              <p className="text-xs text-slate-500 truncate" title={pageData.url}>
                {pageData.url}
              </p>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Page content captured ({Math.round(pageData.content.length / 1000)}k chars)
              </p>
            </div>
          ) : null}
        </div>

        {/* Resume Upload */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Your Resume
          </span>
          <label
            className={`cursor-pointer block p-4 border-2 border-dashed rounded-lg text-center transition-all ${
              fileName && resumeText
                ? 'border-green-400 bg-green-50'
                : 'border-slate-300 hover:border-black hover:bg-slate-50'
            } ${isProcessingFile ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isProcessingFile ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span className="text-sm text-slate-500">Processing...</span>
              </div>
            ) : fileName && resumeText ? (
              <div className="space-y-1">
                <svg className="w-8 h-8 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-green-700 truncate px-2">{fileName}</p>
                <p className="text-xs text-green-600">Click to change</p>
              </div>
            ) : (
              <div className="space-y-1">
                <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-slate-700">Upload Resume</p>
                <p className="text-xs text-slate-500">PDF, DOCX, or DOC</p>
              </div>
            )}
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessingFile}
            />
          </label>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Output Language
          </span>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-black outline-none"
          >
            {Object.values(Language).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p className="font-medium mb-1">How it works:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
            <li>AI analyzes this page for job details</li>
            <li>Matches your resume to the job</li>
            <li>Generates a tailored cover letter PDF</li>
          </ol>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-3">
        {status && (
          <div className="text-center text-sm text-slate-600 animate-pulse">
            {status}
          </div>
        )}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Generate & Download PDF
            </>
          )}
        </button>
        {!canGenerate && !isGenerating && (
          <p className="text-xs text-center text-slate-500">
            {!resumeText ? 'Upload your resume to continue' : !pageData ? 'Page content needed' : ''}
          </p>
        )}

        {/* Website Link */}
        <div className="text-center pt-2 border-t border-slate-100">
          <a
            href="https://covercraft-ai-ivory.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-black transition-colors"
          >
            Need more options? Visit the full website
          </a>
        </div>
      </div>
    </div>
  );
};

export default PopupApp;
