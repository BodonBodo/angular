/// <reference lib="webworker" />
import { WebWorkerMessage } from '../shared/web-worker-message';
import * as lunr from 'lunr';

const SEARCH_TERMS_URL = '/generated/docs/app/search-data.json';
let index: lunr.Index;
const pages: SearchInfo = {};

interface SearchInfo {
  [key: string]: PageInfo;
}

interface PageInfo {
  path: string;
  type: string;
  titleWords: string;
  keyWords: string;
  topics: string;
}

addEventListener('message', handleMessage);

// Create the lunr index - the docs should be an array of objects, each object containing
// the path and search terms for a page
function createIndex(loadIndexFn: IndexLoader): lunr.Index {
  // The lunr typings are missing QueryLexer so we have to add them here manually.
  const queryLexer = (lunr as any as { QueryLexer: { termSeparator: RegExp } }).QueryLexer;
  queryLexer.termSeparator = lunr.tokenizer.separator = /\s+/;
  return lunr(function() {
    this.ref('path');
    this.field('topics', { boost: 15 });
    this.field('titleWords', { boost: 10 });
    this.field('headingWords', { boost: 5 });
    this.field('members', { boost: 4 });
    this.field('keywords', { boost: 2 });
    loadIndexFn(this);
  });
}

// The worker receives a message to load the index and to query the index
function handleMessage(message: { data: WebWorkerMessage }): void {
  const type = message.data.type;
  const id = message.data.id;
  const payload = message.data.payload;
  switch (type) {
    case 'load-index':
      makeRequest(SEARCH_TERMS_URL, (searchInfo: PageInfo[]) => {
        index = createIndex(loadIndex(searchInfo));
        postMessage({ type, id, payload: true });
      });
      break;
    case 'query-index':
      postMessage({ type, id, payload: { query: payload, results: queryIndex(payload) } });
      break;
    default:
      postMessage({ type, id, payload: { error: 'invalid message type' } });
  }
}

// Use XHR to make a request to the server
function makeRequest(url: string, callback: (response: any) => void): void {

  // The JSON file that is loaded should be an array of PageInfo:
  const searchDataRequest = new XMLHttpRequest();
  searchDataRequest.onload = function() {
    callback(JSON.parse(this.responseText));
  };
  searchDataRequest.open('GET', url);
  searchDataRequest.send();
}


// Create the search index from the searchInfo which contains the information about each page to be indexed
function loadIndex(pagesData: PageInfo[]): IndexLoader {
  return (indexBuilder: lunr.Builder) => {
    // Store the pages data to be used in mapping query results back to pages
    // Add search terms from each page to the search index
    pagesData.forEach(page => {
      indexBuilder.add(page);
      pages[page.path] = page;
    });
  };
}

// Query the index and return the processed results
function queryIndex(query: string): PageInfo[] {
  // Strip off quotes
  query = query.replace(/^["']|['"]$/g, '');
  try {
    if (query.length) {
      // First try a query where every term must be present
      const queryAll = query.replace(/(^|\s)([^\s]+)/g, '$1+$2');
      let results = index.search(queryAll);

      // If that was too restrictive just query for any term to be present
      if (results.length === 0) {
        results = index.search(query);
      }

      // If that is still too restrictive then search in the title for the first word in the query
      if (results.length === 0) {
        // E.g. if the search is "ngCont guide" then we search for "ngCont guide title:ngCont*"
        const titleQuery = 'title:*' + query.split(' ', 1)[0] + '*';
        results = index.search(query + ' ' + titleQuery);
      }

      // Map the hits into info about each page to be returned as results
      return results.map(hit => pages[hit.ref]);
    }
  } catch (e) {
    // If the search query cannot be parsed the index throws an error
    // Log it and recover
    console.error(e);
  }
  return [];
}

type IndexLoader = (indexBuilder: lunr.Builder) => void;
