import { ApplicationConfig, importProvidersFrom, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import localeHu from '@angular/common/locales/hu';
import { registerLocaleData } from '@angular/common';
import { authInterceptor } from './shared/auth.interceptor';
import { i18nConfig } from './shared/i18n.config';

registerLocaleData(localeHu);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {provide: LOCALE_ID, useValue: 'hu'},

    importProvidersFrom(TranslateModule.forRoot(i18nConfig))
  ]
};
