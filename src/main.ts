import { bootstrapApplication } from '@angular/platform-browser';
import { APP_CONFIG } from '@app/app.config';
import { AppComponent } from '@app/components/app.component';

bootstrapApplication(AppComponent, APP_CONFIG).catch(console.error);
