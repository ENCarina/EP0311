import { Injectable, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  error(message: string, err: any = null) {
    if (isDevMode()) {
      const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Budapest' });
      console.error(`[${timestamp}] ERROR: ${message}`, err);
    }
  }
  debug(message: string, data: any = null) {
    if (isDevMode()) {
      const timestamp = new Date().toLocaleString('en-GB');
      console.log(`[${timestamp}] DEBUG: ${message}`, data);
    }
  }
}