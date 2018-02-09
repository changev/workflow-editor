import { Component, OnInit, ViewChild, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import * as _ from 'lodash';
import { NodeExtensionService } from './node-extension.service';
import { WorkflowService } from '../workflow.service';

const global = (window as any);
import { CONSTS } from '../consts';

@Component({
  selector: 'app-canvas-graph',
  templateUrl: './canvas-graph.component.html',
  styleUrls: ['./canvas-graph.component.css']
})

export class CanvasGraphComponent implements OnInit {
  @ViewChild('mycanvas') editorCanvas: any;
  @ViewChild('jsoneditor') jsonEditor: any;
  @Input() onWorkflowInput: any;
  @Output() onWorkflowChanged = new EventEmitter();

  workflow: any
  canvas: any;
  graph: any;

  constructor(
    public element: ElementRef,
    public nodeExtensionService: NodeExtensionService,
    public workflowService: WorkflowService
  ){
    this.nodeExtensionService.init(
      // use bind to keep context
      this.afterInputConnect.bind(this),
      this.afterInputDisconnect.bind(this)
    );
  }

  ngOnInit() {
    this.onWorkflowInput.subscribe(
      workflow => {
        if(!_.isEqual(this.workflow, workflow)){
          this.workflow = workflow;
          this.afterWorkflowUpdate(true);
        }
      }
    )
    this.graph = new global.LGraph();
    this.canvas = new global.LGraphCanvas(this.element.nativeElement.querySelector('canvas'), this.graph);

    let self = this;
    this.canvas.getNodeMenuOptions = this.getNodeMenuOptions();
    this.canvas.getCanvasMenuOptions = this.getCanvasMenuOptions();

    this.graph.start();

    // set json
    this.drawNodes();
  }


  // refresh graph
  afterWorkflowUpdate(reRender=false){
      this.onWorkflowChanged.emit(_.cloneDeep(this.workflow));
      if(reRender){
        this.drawNodes();
      }
  }

  // workflow operations
  addTaskForWorkflow(task: any){
    this.workflow.tasks.push(task);
    this.afterWorkflowUpdate();
  }

  delTaskForWorkflow(task: any){
    _.remove(this.workflow.tasks, (t)=>_.isEqual(task, t));
    this.afterWorkflowUpdate();
  }

  /* connect/disconnect callbacks */
  afterInputConnect(taskToBeChanged, preTask, preTaskResult){
      if(preTaskResult === CONSTS.taskResult.failed){
        this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.failed);
      } else
      if(preTaskResult === CONSTS.taskResult.succeeded){
        this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.succeeded);
      } else
      if(preTaskResult === CONSTS.taskResult.finished){
        this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.finished);
      }
  }

  afterInputDisconnect(taskToBeChanged){
      this.changeTaskWaitOn(taskToBeChanged);
  }

  //helpers
  changeTaskWaitOn(taskToBeChanged, preTask?, waitOnText?){
    if(!preTask && !waitOnText){
      _.forEach(this.workflow.tasks, (task)=>{
        if(_.isEqual(task, taskToBeChanged)){
          delete task["waitOn"];
        }
      });
    } else {
      _.forEach(this.workflow.tasks, (task)=>{
        if(_.isEqual(task, taskToBeChanged)){
          task["waitOn"] = _.set({}, preTask.label, waitOnText);
        }
      });
    }
    this.afterWorkflowUpdate();
  }
  /* end connect/disconnect callbacks */

  /* rewrite lib class prototype functions */
  getCanvasMenuOptions() {
    let self = this;
    return function(){
    	let options = [
    			{ content:"Add Node", has_submenu: true, callback: self.addNode()}
    		];
    	return options;
    }
  }

  addNode(){
    // mothod 1 for keep current context
    let self = this;
    return function(node, options, e, preMenu){
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
          self.addTaskForWorkflow(node.properties.task);{
          }

    		}
    	}

    	return false;
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

  removeNode(value, options, e, menu, node){
    // mothod 2 for keep current context: use bind
    this.delTaskForWorkflow(node.properties.task)
    global.LGraphCanvas.onMenuNodeRemove(value, options, e, menu, node);
  }
  /* end rewrite lib class prototype functions */

  drawNodes(){
    if(!this.workflow) return;
    this.graph.clear();
    let coordinateArray = this.distributePosition();

    // sort based on wait on
    // chain running workflow
    let linkPropertyName = 'waitingOn',
        linkKey = 'instanceId';
    let chainResult = chainNodes.bind(this)(linkPropertyName, linkKey);

    // this is for workflow defination
    if(_.isEmpty(chainResult[0])){
      linkPropertyName = 'wainOn';
      linkKey = 'label';
      chainResult = chainNodes.bind(this)('waitOn', 'label')
    }

    let helperMap = chainResult[0];
    let leftTasks = chainResult[1];

    // chain the first task, and put all isolated in the tail
    let helperMapOnlyKey =  _.keys(helperMap)[0];
    _.forEach(leftTasks, (task) => {
      if(task[linkKey] === helperMapOnlyKey){
        helperMap[helperMapOnlyKey] = [task].concat(helperMap[helperMapOnlyKey]);
      } else {
        helperMap[helperMapOnlyKey].push(task);
      }
    })
    this.workflow.tasks = _.values(helperMap)[0];


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
    _.forEach(allNodes, (taskNode, index) => {
      let task = taskNode.properties.task;

      // for editor: workflow define
      if(!_.isUndefined(task.waitOn) &&  !_.isEmpty(task.waitOn)){
        let originNode = _.find(allNodes, (node) => node.title === _.keys(task.waitOn)[0]);
        let originSlot = _.findIndex(originNode.outputs, (o) => o.name === _.values(task.waitOn)[0]);
        originNode.connect(originSlot, taskNode, 0);
      }

      // for viewer: running workflow
      if(!_.isUndefined(task.waitingOn) && !_.isEmpty(task.waitingOn)){
        let originNode = _.find(allNodes, (node) => node.properties.task.instanceId === _.keys(task.waitingOn)[0]);
        let originSlot = _.findIndex(originNode.outputs, (o) =>  {
          if(typeof _.values(task.waitingOn)[0] === 'object'){
            return o.name === _.values(task.waitingOn)[0][0];
          } else {
            return _.values(task.waitingOn)[0];
          }
        });
        originNode.connect(originSlot, taskNode, 0);
      }
    });

    // helpers
    function chainNodes(linkPropertyName, linkKeyName){
      let helperMap = {};
      let leftTasks = [];
      // 1 init helperMap
      // waitingOn is running workflow
      _.forEach(this.workflow.tasks, (task) => {
        if(!_.isUndefined(task[linkPropertyName]) && !_.isEmpty(task[linkPropertyName])){
          let linkKey = _.keys(task[linkPropertyName])[0];
          (helperMap[linkKey] || (helperMap[linkKey]=[])).push(task);
        } else {
          leftTasks.push(task);
        }
      })
      // 2 intergrate into one chain
      while(_.keys(helperMap).length > 1){
        _.forEach(helperMap, (taskArray, waitingOnInstanceId) => {
          _.forEach(taskArray, (task) => {
              if(task.instanceId in helperMap) {
                helperMap[waitingOnInstanceId] = helperMap[waitingOnInstanceId].concat(helperMap[task.instanceId]);
                delete helperMap[task.instanceId];
              }
          });
        })
      }
      return [helperMap, leftTasks];
    }
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
