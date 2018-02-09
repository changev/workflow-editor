import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { NodeExtensionService } from './node-extension.service';
import { WorkflowService } from './workflow.service';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    NodeExtensionService,
    WorkflowService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
