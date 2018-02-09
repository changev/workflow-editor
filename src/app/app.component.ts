import { Component, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit  {
  constructor(public http: HttpClient){}
  ngOnInit(){
    this.http.get("http://10.62.59.205:9090/api/2.0/nodes").subscribe(
      data => console.log(data)
    )
  }
}
