import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModuleConfig } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { I18N_HU, I18N_EN } from './i18n-data';

export class CustomTranslateLoader implements TranslateLoader {
  //constructor(private http: HttpClient) {}
  
  getTranslation(lang: string): Observable<any> {
    if (lang === 'hu') {
      return of(I18N_HU);
    } else if (lang === 'en') {
      return of(I18N_EN);
    }
    return of(I18N_HU); 
  }

  //   const v = new Date().getTime();
  //   return this.http.get(`./assets/i18n/${lang}.json?v=${v}`);
  // }
}
// export function HttpLoaderFactory(http: HttpClient) {
//   return new CustomTranslateLoader(http);
// }

export const i18nConfig = {
  loader: {
    provide: TranslateLoader,
    useClass: CustomTranslateLoader
    //deps: [HttpClient]
  },
  fallbackLang: 'hu'
};