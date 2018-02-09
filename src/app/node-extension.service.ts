import { Injectable } from '@angular/core';
import { WorkflowService } from './workflow.service';
import { CONSTS } from './consts';
// import once to inject this script to window.
let win = (window as any);

@Injectable()
export class NodeExtensionService {
    constructor(
      public workflowService: WorkflowService
    ){
      let self = this;
      // inject hook actions
      Task.prototype.onConnectionsChange = function(connection, slot, connected, link_info){
        if(connection===win.LiteGraph.OUTPUT){
          console.log("output")
        }
        if(connection===win.LiteGraph.INPUT){
          console.log("input")
          console.log(connection);
          console.log(slot);
          console.log(connected);
          console.log(link_info);

          let targetNode = this.graph.getNodeById( link_info.target_id );
          let originNode = this.graph.getNodeById(link_info.origin_id);
          let originOutput = originNode.outputs[link_info.origin_slot];
          let originOutputName = originOutput.name;
          let task = targetNode.properties.task;
          let pretask = originNode.properties.task;

          if(!task){
            console.log("error, please put task into node properties when init")
          }
          let sign = connected ? 'connect' : 'disconnect';
          self.workflowService.workflowEvent.emit('input '+sign, task, pretask, originOutputName)
        }
      }
      //register in the system
      win.LiteGraph.registerNodeType("rackhd/task", Task);
    }
}

// node classes
class Task {
  // prevent ts error
  onConnectionsChange: any;
  title = "Task";
  addInput: any;
  addProperty: any;
  addOutput: any;

  constructor(){
    this.addProperty("task", {});
    this.addInput("pre-task", win.LiteGraph.EVENT);
    this.addOutput(CONSTS.taskResult.failed, win.LiteGraph.EVENT);
    this.addOutput(CONSTS.taskResult.succeeded, win.LiteGraph.EVENT);
    this.addOutput(CONSTS.taskResult.finished, win.LiteGraph.EVENT);
  }
}
