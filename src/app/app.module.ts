import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { NodeExtensionService } from './canvas-graph/node-extension.service';
import { WorkflowService } from './workflow.service';
import { CanvasGraphComponent } from './canvas-graph/canvas-graph.component';
import { WorkflowEditorComponent } from './workflow-editor/workflow-editor.component';
import { WorkflowViewerComponent } from './workflow-viewer/workflow-viewer.component';

import { HttpClientModule } from '@angular/common/http'

@NgModule({
  declarations: [
    AppComponent,
    CanvasGraphComponent,
    WorkflowEditorComponent,
    WorkflowViewerComponent
  ],
  imports: [
    BrowserModule,HttpClientModule
  ],
  providers: [
    NodeExtensionService,
    WorkflowService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
