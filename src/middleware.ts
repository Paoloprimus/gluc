import {NextRequest, NextResponse} from 'next/server';

const locales = ['it', 'de', 'en'];
const defaultLocale = 'en'; // English as default for international users

// Language codes mapping
const germanLanguages = ['de', 'de-DE', 'de-AT', 'de-CH'];
const italianLanguages = ['it', 'it-IT', 'it-CH'];

export function middleware(request: NextRequest) {
  // Check if locale cookie exists
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  
  if (localeCookie && locales.includes(localeCookie)) {
    return NextResponse.next();
  }
  
  // Auto-detect locale from Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  const preferredLanguage = acceptLanguage.split(',')[0]?.split(';')[0]?.trim();
  
  let detectedLocale = defaultLocale;
  if (preferredLanguage) {
    const langLower = preferredLanguage.toLowerCase();
    if (germanLanguages.some(lang => langLower.startsWith(lang.toLowerCase()))) {
      detectedLocale = 'de';
    } else if (italianLanguages.some(lang => langLower.startsWith(lang.toLowerCase()))) {
      detectedLocale = 'it';
    }
    // Otherwise stays 'en' (default)
  }
  
  // Set the locale cookie
  const response = NextResponse.next();
  response.cookies.set('NEXT_LOCALE', detectedLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
