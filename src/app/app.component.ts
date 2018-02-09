import { Component, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { NodeExtensionService } from './node-extension.service';
import { WorkflowService } from './workflow.service';
const global = (window as any);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit  {
  @ViewChild('mycanvas') editorCanvas: any;
  @ViewChild('jsoneditor') jsonEditor: any;
  title = 'app';
  graph: any;
  workflow: any;
  editor: any;

  constructor(
    nodeExtensionService: NodeExtensionService,
    public workflowService: WorkflowService
  ){
    this.workflowService.workflowEvent.on('workflow updated', (reRender=false)=>{
      this.workflow = this.workflowService.workflowInEditor;
      this.updateEditor();
      if(reRender){
        console.log("reRender")
        this.drawNodes();
      }
    });
  }

  ngOnInit() {
    this.workflow = this.workflowService.getInitWorkflow();
    this.workflowService.workflowInEditor = this.workflow;
    this.graph = new global.LGraph();
    let canvas = new global.LGraphCanvas("#mycanvas", this.graph);

    let self = this;
    canvas.getNodeMenuOptions = this.getNodeMenuOptions();
    canvas.getCanvasMenuOptions = this.getCanvasMenuOptions();

    this.graph.start();

    let container = document.getElementById("jsoneditor");
    let options = {mode:'code'};
    this.editor = new global.JSONEditor(container, options);

    // set json
    this.drawNodes();
    this.updateEditor();
  }

  updateEditor(){
    this.editor.set(this.workflowService.workflowInEditor);
  }

  applyWorkflowJson(){
    this.workflowService.updateWorkflowInEditor(this.editor.get());
  }

  addNode(){
    // mothod 1 for keep current context
    let self = this;
    return function(node, options, e, preMenu){
      console.log("add node");
    	let canvas = global.LGraphCanvas.active_canvas;
    	let ref_window = canvas.getCanvasWindow();

    	let entries = [];
    	entries.push({ content: 'rackhd', has_submenu: true});

    	let menu = new global.LiteGraph.ContextMenu( entries, { event: e, callback: innerClick, parentMenu: preMenu }, ref_window);
    	function innerClick( v, option, e ){
        // just mock here, should be gotten from backend service
    		let node_types = ["Task.poller", "Task.smi"];
    		let values = [];
    		for(let i in node_types)
    			values.push( { content: node_types[i]});
    		new global.LiteGraph.ContextMenu( values, {event: e, callback: innerCreate, parentMenu: menu }, ref_window);
    		return false;
    	}

    	function innerCreate( v, e )
    	{
    		let firstEvent = preMenu.getFirstEvent();
    		let node = global.LiteGraph.createNode("rackhd/task");
    		if(node)
    		{
    			node.pos = canvas.convertEventToCanvas( firstEvent );
          node.properties.task = self.workflowService.getTaskTemplateByType(v.content);
          node.title = node.properties.task.label;
    			canvas.graph.add( node );
          self.workflowService.addTaskForWorkflowInEditor(node.properties.task);
    		}
    	}

    	return false;
    }
  }

  removeNode(value, options, e, menu, node){
    // mothod 2 for keep current context: use bind
    console.log(value)
    console.log(options)
    console.log(e)
    console.log(menu)
    console.log(node)
    this.workflowService.delTaskForWorkflowInEditor(node.properties.task)
    global.LGraphCanvas.onMenuNodeRemove(value, options, e, menu, node);
  }

  getCanvasMenuOptions() {
    let self = this;
    return function(){
    	let options = [
    			{ content:"Add Node", has_submenu: true, callback: self.addNode()}
    		];
    	return options;
    }
  }

  getNodeMenuOptions(){
    let self = this;
    return function(node){
      let options = [];
      if( node.removable !== false )
          options.push(null,{content:"Remove", callback: self.removeNode.bind(self) });
      if(node.graph && node.graph.onGetNodeMenuOptions )
        node.graph.onGetNodeMenuOptions( options, node );
      return options;
    }
  }

  drawNodes(){
    this.graph.clear();
    let coordinateArray = this.distributePosition();
    // add nodes
    _.forEach(this.workflow.tasks, (task, index) => {
      let taskNode = global.LiteGraph.createNode("rackhd/task");
      taskNode.title = task.label;
      taskNode.properties.task = task;
      taskNode.pos = [
        coordinateArray[index][0]-taskNode.size[0],
        coordinateArray[index][1]-taskNode.size[1]
      ]

      this.graph.add(taskNode);
    });
    // draw links
    let allNodes = this.graph.findNodesByType('rackhd/task');
    console.log(allNodes)
    _.forEach(allNodes, (taskNode, index) => {
      let task = taskNode.properties.task;
      if(!_.isUndefined(task.waitOn)){
        let originNode = _.find(allNodes, (node) => node.title === _.keys(task.waitOn)[0]);
        let originSlot = _.findIndex(originNode.outputs, (o) => o.name === _.values(task.waitOn)[0]);
        originNode.connect(originSlot, taskNode, 0);
      }
    });
  }

  // helper of node positions
  distributePosition(){
    let coordinateArray = [];
    let canvasWidth = this.editorCanvas.nativeElement.offsetWidth;
    let canvasHeight = this.editorCanvas.nativeElement.offsetHeight;
    let tasksNum  = this.workflow.tasks.length;

    let index = 0;
    for (;index*index < tasksNum; index++) {}

    for (let i = 0; i < index*index; i++) {
      let x = i%index;
      let y = parseInt(''+i/index);
      x = canvasWidth/(index)*(x+0.5);
      y = canvasHeight/(index)*(y+0.5);
      coordinateArray.push([x,y]);
    }
    return coordinateArray;
  }

}
