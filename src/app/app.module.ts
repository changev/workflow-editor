import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { NodeExtensionService } from './canvas-graph/node-extension.service';
import { WorkflowService } from './workflow.service';
import { CanvasGraphComponent } from './canvas-graph/canvas-graph.component';
import { WorkflowEditorComponent } from './workflow-editor/workflow-editor.component';


@NgModule({
  declarations: [
    AppComponent,
    CanvasGraphComponent,
    WorkflowEditorComponent
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
