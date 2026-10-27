// The one RapidAPI listing this node calls, and the User-Agent its calls carry so they can be told apart from other
// clients of the same API. VERSION is pinned to package.json by test/version.test.mjs.
export const VERSION = '0.1.0';
export const RAPIDAPI_HOST = 'google-trends-data.p.rapidapi.com';
export const USER_AGENT = `n8n-nodes-tallyrake/${VERSION}`;
