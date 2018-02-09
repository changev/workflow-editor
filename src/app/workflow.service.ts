import { Injectable } from '@angular/core';
import { Event } from "typescript.events";
import { CONSTS } from './consts';

import * as uuid from 'uuid/v4';
import * as _ from 'lodash';

@Injectable()
export class WorkflowService {
    _workflowInEditor: any;
    workflowEvent: Event;
    set workflowInEditor(workflow: any){
      this._workflowInEditor = workflow;
    }
    get workflowInEditor(){
      return this._workflowInEditor;
    }

    constructor(){
      this.workflowEvent = new WorkflowEvent();

      this.workflowEvent.on('input connect', (taskToBeChanged, preTask, preTaskResult) => {
        if(preTaskResult === CONSTS.taskResult.failed){
          this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.failed);
        } else
        if(preTaskResult === CONSTS.taskResult.succeeded){
          this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.succeeded);
        } else
        if(preTaskResult === CONSTS.taskResult.finished){
          this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.finished);
        }
      });

      this.workflowEvent.on('input disconnect', (taskToBeChanged) => {
        this.changeTaskWaitOn(taskToBeChanged);
      });
    }

    //helpers
    changeTaskWaitOn(taskToBeChanged, preTask?, waitOnText?){
      if(!preTask && !waitOnText){
        _.forEach(this._workflowInEditor.tasks, (task)=>{
          if(_.isEqual(task, taskToBeChanged)){
            delete task["waitOn"];
          }
        });
      } else {
        _.forEach(this._workflowInEditor.tasks, (task)=>{
          if(_.isEqual(task, taskToBeChanged)){
            task["waitOn"] = _.set({}, preTask.label, waitOnText);
          }
        });
      }
      this.workflowEvent.emit('workflow updated');
    }

    /**
      graph actions trigger with reRender=false;
    */
    addTaskForWorkflowInEditor(task: any){
      this._workflowInEditor.tasks.push(task);
      this.workflowEvent.emit('workflow updated');
    }

    delTaskForWorkflowInEditor(task: any){
      _.remove(this._workflowInEditor.tasks, (t)=>_.isEqual(task, t));
      this.workflowEvent.emit('workflow updated');
    }

    updateWorkflowInEditor(workflow: any, reRender=true){
      if(!_.isEqual(this._workflowInEditor, workflow)){
        this._workflowInEditor = workflow
        this.workflowEvent.emit('workflow updated', reRender);
      }
    }

    getInitWorkflow(){
      return {
        "friendlyName": "",
        "injectableName": "",
        "tasks": [
          {
            "label": "new-task-1517998797597",
            "taskName": "Task.noop"
          },
          {
            "label": "new-task-1517998797390",
            "taskName": "Task.noop",
            "waitOn": {
              "new-task-1517998797597": "failed"
            }
          },
          {
            "label": "new-task-1517998797118",
            "taskName": "Task.noop"
          },
          {
            "label": "new-task-1517998796910",
            "taskName": "Task.noop"
          }
        ]
      }
    }

    // just mock here, should be replaced in actural
    getTaskTemplateByType(taskType: string){
        return {
          "label": "new-task-" + uuid().substr(0,10),
          "taskDefinition": {
            "friendlyName": taskType,
            "injectableName": taskType,
            "implementsTask": taskType,
            "options": {
              "profile": "boot-livecd.ipxe",
              "version": "livecd",
              "repo": "{{file.server}}/LiveCD/{{options.version}}"
            },
            "properties": {
              "os": {
                "linux": {
                  "distribution": "livecd"
                }
              }
            }
          }
        }
    }

}

class WorkflowEvent extends Event {}
