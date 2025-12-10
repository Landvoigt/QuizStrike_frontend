import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: "https://8e061aef3b4597d055eb6501ba6c06ff@o4509323430395904.ingest.de.sentry.io/4510512593633360",
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracePropagationTargets: [
    'localhost',
    '127.0.0.1',
    'quizstrike-server.timvoigt.ch',
    /^https:\/\/quizstrike-server\.timvoigt\.ch\/api/
  ],
  tracesSampleRate: 1.0,
  sendDefaultPii: true
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
