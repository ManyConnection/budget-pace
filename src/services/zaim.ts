// Zaim API Service
// OAuth 1.0a implementation for Zaim

import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// Zaim API Configuration
export const ZAIM_CONFIG = {
  consumerKey: '308765007f28433fa216085d4f76528782b82560',
  consumerSecret: '8df0a859e81dfdb2b3d34099573eb4697734f436',
  requestTokenUrl: 'https://api.zaim.net/v2/auth/request',
  authorizeUrl: 'https://auth.zaim.net/users/auth',
  accessTokenUrl: 'https://api.zaim.net/v2/auth/access',
  apiBaseUrl: 'https://api.zaim.net/v2',
  // Use oob for PIN-based flow
  callbackUrl: 'oob',
};

// Storage keys
const STORAGE_KEYS = {
  accessToken: '@zaim_access_token',
  accessTokenSecret: '@zaim_access_token_secret',
  isConnected: '@zaim_is_connected',
  requestToken: '@zaim_request_token',
  requestTokenSecret: '@zaim_request_token_secret',
};

// Generate OAuth signature base string
function generateSignatureBaseString(
  method: string,
  url: string,
  params: Record<string, string>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  return `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
}

// Generate OAuth signature (HMAC-SHA1)
function generateSignature(
  baseString: string,
  consumerSecret: string,
  tokenSecret: string = ''
): string {
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hash = CryptoJS.HmacSHA1(baseString, signingKey);
  return CryptoJS.enc.Base64.stringify(hash);
}

// Generate nonce
function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

// Generate timestamp
function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

// Build OAuth header
function buildOAuthHeader(
  method: string,
  url: string,
  oauthExtraParams: Record<string, string> = {},
  requestParams: Record<string, string> = {},
  tokenSecret: string = ''
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: ZAIM_CONFIG.consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_nonce: generateNonce(),
    oauth_version: '1.0',
    ...oauthExtraParams,
  };

  // Combine OAuth params and request params for signature
  const allParams = { ...oauthParams, ...requestParams };
  const baseString = generateSignatureBaseString(method, url, allParams);
  const signature = generateSignature(baseString, ZAIM_CONFIG.consumerSecret, tokenSecret);
  
  oauthParams.oauth_signature = signature;

  // Only OAuth params go in the header (not request params)
  const headerParams = Object.keys(oauthParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return `OAuth ${headerParams}`;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  step?: string;
  authUrl?: string;
}

// Zaim API Service Class
class ZaimService {
  private accessToken: string | null = null;
  private accessTokenSecret: string | null = null;

  async init(): Promise<void> {
    this.accessToken = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
    this.accessTokenSecret = await AsyncStorage.getItem(STORAGE_KEYS.accessTokenSecret);
  }

  async isConnected(): Promise<boolean> {
    await this.init();
    const connected = await AsyncStorage.getItem(STORAGE_KEYS.isConnected);
    return connected === 'true' && !!this.accessToken;
  }

  // Check if we're waiting for PIN input
  async isWaitingForPIN(): Promise<boolean> {
    const requestToken = await AsyncStorage.getItem(STORAGE_KEYS.requestToken);
    return !!requestToken;
  }

  // Step 1: Get request token and return authorization URL
  async startAuth(): Promise<AuthResult> {
    try {
      // Step 1: Get request token
      const oauthHeader = buildOAuthHeader('POST', ZAIM_CONFIG.requestTokenUrl, {
        oauth_callback: ZAIM_CONFIG.callbackUrl,
      }, {}, '');

      const response = await fetch(ZAIM_CONFIG.requestTokenUrl, {
        method: 'POST',
        headers: {
          Authorization: oauthHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          success: false,
          error: `リクエストトークン取得失敗: ${response.status}`,
          step: 'request_token',
        };
      }

      const params = new URLSearchParams(text);
      const requestToken = params.get('oauth_token');
      const requestTokenSecret = params.get('oauth_token_secret');

      if (!requestToken || !requestTokenSecret) {
        return {
          success: false,
          error: 'トークンがレスポンスに含まれていません',
          step: 'parse_request_token',
        };
      }

      // Store request token for later use
      await AsyncStorage.setItem(STORAGE_KEYS.requestToken, requestToken);
      await AsyncStorage.setItem(STORAGE_KEYS.requestTokenSecret, requestTokenSecret);

      // Return the auth URL for user to open
      const authUrl = `${ZAIM_CONFIG.authorizeUrl}?oauth_token=${requestToken}`;

      return {
        success: true,
        authUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || String(error),
        step: 'exception',
      };
    }
  }

  // Step 2: Complete auth with PIN/verifier code
  async completeAuthWithPIN(verifier: string): Promise<AuthResult> {
    try {
      const requestToken = await AsyncStorage.getItem(STORAGE_KEYS.requestToken);
      const requestTokenSecret = await AsyncStorage.getItem(STORAGE_KEYS.requestTokenSecret);

      if (!requestToken || !requestTokenSecret) {
        return {
          success: false,
          error: 'リクエストトークンが見つかりません。再度連携を開始してください。',
          step: 'missing_request_token',
        };
      }

      // Exchange for access token
      const oauthHeader = buildOAuthHeader(
        'POST',
        ZAIM_CONFIG.accessTokenUrl,
        {
          oauth_token: requestToken,
          oauth_verifier: verifier.trim(),
        },
        {},
        requestTokenSecret
      );

      const response = await fetch(ZAIM_CONFIG.accessTokenUrl, {
        method: 'POST',
        headers: {
          Authorization: oauthHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          success: false,
          error: `アクセストークン取得失敗: ${response.status}\n${text}`,
          step: 'access_token',
        };
      }

      const params = new URLSearchParams(text);
      const accessToken = params.get('oauth_token');
      const accessTokenSecret = params.get('oauth_token_secret');

      if (!accessToken || !accessTokenSecret) {
        return {
          success: false,
          error: 'アクセストークンがレスポンスに含まれていません',
          step: 'parse_access_token',
        };
      }

      // Store tokens
      await AsyncStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.accessTokenSecret, accessTokenSecret);
      await AsyncStorage.setItem(STORAGE_KEYS.isConnected, 'true');

      this.accessToken = accessToken;
      this.accessTokenSecret = accessTokenSecret;

      // Clean up request token
      await AsyncStorage.removeItem(STORAGE_KEYS.requestToken);
      await AsyncStorage.removeItem(STORAGE_KEYS.requestTokenSecret);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || String(error),
        step: 'pin_exception',
      };
    }
  }

  // Cancel pending auth
  async cancelAuth(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.requestToken);
    await AsyncStorage.removeItem(STORAGE_KEYS.requestTokenSecret);
  }

  // Disconnect from Zaim
  async disconnect(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.accessToken);
    await AsyncStorage.removeItem(STORAGE_KEYS.accessTokenSecret);
    await AsyncStorage.removeItem(STORAGE_KEYS.isConnected);
    await AsyncStorage.removeItem(STORAGE_KEYS.requestToken);
    await AsyncStorage.removeItem(STORAGE_KEYS.requestTokenSecret);
    this.accessToken = null;
    this.accessTokenSecret = null;
  }

  // Make authenticated API request
  private async apiRequest<T>(
    method: string,
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    if (!this.accessToken || !this.accessTokenSecret) {
      throw new Error('Not authenticated');
    }

    const url = `${ZAIM_CONFIG.apiBaseUrl}${endpoint}`;
    
    // OAuth params and request params are separate
    const oauthHeader = buildOAuthHeader(
      method,
      url,
      { oauth_token: this.accessToken },
      params,  // Request params for signature
      this.accessTokenSecret
    );

    const queryString = Object.keys(params).length > 0
      ? '?' + new URLSearchParams(params).toString()
      : '';

    const response = await fetch(`${url}${queryString}`, {
      method,
      headers: {
        Authorization: oauthHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Get money records (transactions)
  async getMoney(params: {
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
    category_id?: number;
    genre_id?: number;
    mode?: 'payment' | 'income' | 'transfer';
  } = {}): Promise<ZaimMoneyResponse> {
    const queryParams: Record<string, string> = {};
    
    if (params.start_date) queryParams.start_date = params.start_date;
    if (params.end_date) queryParams.end_date = params.end_date;
    if (params.page) queryParams.page = params.page.toString();
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.category_id) queryParams.category_id = params.category_id.toString();
    if (params.genre_id) queryParams.genre_id = params.genre_id.toString();
    if (params.mode) queryParams.mode = params.mode;

    return this.apiRequest<ZaimMoneyResponse>('GET', '/home/money', queryParams);
  }

  // Get categories
  async getCategories(): Promise<ZaimCategoryResponse> {
    return this.apiRequest<ZaimCategoryResponse>('GET', '/home/category');
  }

  // Get genres (sub-categories)
  async getGenres(): Promise<ZaimGenreResponse> {
    return this.apiRequest<ZaimGenreResponse>('GET', '/home/genre');
  }

  // Get user info
  async getUser(): Promise<ZaimUserResponse> {
    return this.apiRequest<ZaimUserResponse>('GET', '/home/user/verify');
  }
}

// Types for Zaim API responses
export interface ZaimMoneyRecord {
  id: number;
  mode: 'payment' | 'income' | 'transfer';
  user_id: number;
  date: string;
  category_id: number;
  genre_id: number;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  comment: string;
  place: string;
  created: string;
  currency_code: string;
}

export interface ZaimMoneyResponse {
  money: ZaimMoneyRecord[];
  requested: number;
}

export interface ZaimCategory {
  id: number;
  mode: 'payment' | 'income';
  name: string;
  sort: number;
  active: number;
  modified: string;
}

export interface ZaimCategoryResponse {
  categories: ZaimCategory[];
}

export interface ZaimGenre {
  id: number;
  category_id: number;
  name: string;
  sort: number;
  active: number;
  modified: string;
}

export interface ZaimGenreResponse {
  genres: ZaimGenre[];
}

export interface ZaimUserResponse {
  me: {
    id: number;
    login: string;
    name: string;
  };
}

// Export singleton instance
export const zaimService = new ZaimService();
