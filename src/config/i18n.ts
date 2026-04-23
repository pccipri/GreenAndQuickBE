import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

i18next.use(Backend).init({
  lng: 'en', // default language
  fallbackLng: 'en',
  ns: ['emails', 'notifications', 'pdfs'],
  defaultNS: 'emails',
  backend: {
    loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
  },
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  detection: {
    order: ['header', 'querystring', 'cookie'],
    lookupHeader: 'accept-language',
    lookupQuerystring: 'lang',
    lookupCookie: 'i18next',
    caches: ['cookie'],
  },
});

export default i18next;
