import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { SENTRY_TARGET, SENTRY_URL } from './config/config';

import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: SENTRY_URL,
  integrations: [Sentry.browserTracingIntegration()],
  tracePropagationTargets: SENTRY_TARGET,
  tracesSampleRate: 1.0,
  // Sentry v11: replaces `sendDefaultPii` (defaults collect everything); never send the player token.
  dataCollection: {
    httpHeaders: { request: { deny: ['x-player-token'] }, response: true },
  },
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
