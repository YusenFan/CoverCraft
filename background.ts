// Background service worker for CoverCraft Chrome Extension (Popup Mode)

// Function to scrape full page content for LLM analysis
function scrapePageContent(): {
  url: string;
  title: string;
  content: string;
} {
  const url = window.location.href;
  const title = document.title;

  // Get the main content of the page
  // Remove script, style, nav, footer elements to focus on main content
  const clone = document.body.cloneNode(true) as HTMLElement;

  // Remove non-content elements
  const removeSelectors = ['script', 'style', 'nav', 'footer', 'header', 'iframe', 'noscript', 'svg', 'img'];
  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Get text content, clean up whitespace
  let content = clone.innerText || clone.textContent || '';
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
    .substring(0, 15000); // Limit to ~15k chars for LLM context

  return { url, title, content };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_PAGE') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ error: 'No active tab found' });
        return;
      }

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: scrapePageContent,
        });

        if (results && results[0]?.result) {
          sendResponse({ success: true, data: results[0].result });
        } else {
          sendResponse({ error: 'Could not scrape page content' });
        }
      } catch (error: any) {
        console.error('Scrape error:', error);
        sendResponse({ error: error.message || 'Failed to scrape page' });
      }
    });
    return true; // Keep message channel open for async response
  }
});
