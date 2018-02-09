import { Component, OnInit, EventEmitter, AfterViewInit } from '@angular/core';
import { WorkflowService } from '../workflow.service';

import * as _ from 'lodash';

const global = (window as any);

@Component({
  selector: 'app-workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: ['./workflow-editor.component.css']
})
export class WorkflowEditorComponent implements OnInit, AfterViewInit {
  onWorkflowInput = new EventEmitter();
  workflow: any;
  editor: any;
  constructor(
    public workflowService: WorkflowService
  ) { }

  ngOnInit() {
    this.workflow = this.workflowService.getInitWorkflow();
    let container = document.getElementById("jsoneditor");
    let options = {mode:'code'};
    this.editor = new global.JSONEditor(container, options);
    this.updateEditor(this.workflow);
  }

  ngAfterViewInit(){
    this.pushDataToCanvas();
  }

  applyWorkflowJson(){
    this.workflow = this.editor.get();
    this.pushDataToCanvas();
  }

  updateEditor(workflow: any){
    this.editor.set(workflow);
  }

  pushDataToCanvas(){
    this.onWorkflowInput.emit(_.cloneDeep(this.workflow));
  }

  onWorkflowChanged(workflow: any){
    if(!_.isEqual(workflow, this.workflow)){
      this.workflow = workflow;
      this.updateEditor(workflow);
    }
  }

}
