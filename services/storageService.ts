/**
 * Storage Service for Chrome Extension
 * Provides abstraction over chrome.storage API with fallback to localStorage
 */

export interface StorageData {
  // User preferences
  language?: string;
  tone?: string;
  length?: string;
  
  // User information (auto-fill)
  fullName?: string;
  email?: string;
  phone?: string;
  
  // Cached data
  resumeText?: string;
  resumeData?: string;
  resumeMimeType?: string;
  
  // Draft state
  draftJobDescription?: string;
  draftCompanyName?: string;
  draftJobTitle?: string;
  draftJobLink?: string;
  draftAdditionalInstructions?: string;
  
  // Generated letters history (limit to last 10)
  letterHistory?: Array<{
    id: string;
    timestamp: number;
    companyName: string;
    jobTitle: string;
    content: string;
  }>;
}

class StorageService {
  private isExtension: boolean;

  constructor() {
    // Detect if running in Chrome extension context
    this.isExtension = typeof chrome !== 'undefined' && chrome.storage !== undefined;
  }

  /**
   * Save data to storage
   */
  async save(data: Partial<StorageData>): Promise<void> {
    if (this.isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    } else {
      // Fallback to localStorage for web app
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      return Promise.resolve();
    }
  }

  /**
   * Load data from storage
   */
  async load(keys?: string[]): Promise<StorageData> {
    if (this.isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys || null, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result as StorageData);
          }
        });
      });
    } else {
      // Fallback to localStorage
      const result: StorageData = {};
      const keysToLoad = keys || Object.keys(localStorage);
      keysToLoad.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            result[key as keyof StorageData] = JSON.parse(value);
          } catch {
            // If parsing fails, store as string
            result[key as keyof StorageData] = value as any;
          }
        }
      });
      return Promise.resolve(result);
    }
  }

  /**
   * Remove specific keys from storage
   */
  async remove(keys: string[]): Promise<void> {
    if (this.isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    } else {
      keys.forEach((key) => localStorage.removeItem(key));
      return Promise.resolve();
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    if (this.isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    } else {
      localStorage.clear();
      return Promise.resolve();
    }
  }

  /**
   * Save draft state for autosave
   */
  async saveDraft(formData: any): Promise<void> {
    return this.save({
      draftJobDescription: formData.jobDescription,
      draftCompanyName: formData.companyName,
      draftJobTitle: formData.jobTitle,
      draftJobLink: formData.jobLink,
      draftAdditionalInstructions: formData.additionalInstructions,
    });
  }

  /**
   * Load draft state
   */
  async loadDraft(): Promise<Partial<StorageData>> {
    return this.load([
      'draftJobDescription',
      'draftCompanyName',
      'draftJobTitle',
      'draftJobLink',
      'draftAdditionalInstructions',
    ]);
  }

  /**
   * Save user preferences
   */
  async savePreferences(prefs: Pick<StorageData, 'language' | 'tone' | 'length'>): Promise<void> {
    return this.save(prefs);
  }

  /**
   * Load user preferences
   */
  async loadPreferences(): Promise<Partial<StorageData>> {
    return this.load(['language', 'tone', 'length']);
  }

  /**
   * Add a letter to history (max 10)
   */
  async addToHistory(letter: {
    companyName: string;
    jobTitle: string;
    content: string;
  }): Promise<void> {
    const data = await this.load(['letterHistory']);
    const history = data.letterHistory || [];
    
    const newEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...letter,
    };

    // Add to beginning, keep only last 10
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    
    return this.save({ letterHistory: updatedHistory });
  }

  /**
   * Get letter history
   */
  async getHistory(): Promise<StorageData['letterHistory']> {
    const data = await this.load(['letterHistory']);
    return data.letterHistory || [];
  }
}

// Export singleton instance
export const storageService = new StorageService();


