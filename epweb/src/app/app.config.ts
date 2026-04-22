import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import localeHu from '@angular/common/locales/hu';
import { registerLocaleData } from '@angular/common';
import { authInterceptor } from './shared/auth.interceptor';
import localeEn from '@angular/common/locales/en';

registerLocaleData(localeHu);
registerLocaleData(localeEn);

export const appConfig: ApplicationConfig = {
   providers: [
    provideZoneChangeDetection({ eventCoalescing:true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),

    provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json'        
      }),
    }),
    
    {provide: LOCALE_ID, 
     useValue:localStorage.getItem('lang') || 'hu' },

    provideBrowserGlobalErrorListeners(),
  ]
};
