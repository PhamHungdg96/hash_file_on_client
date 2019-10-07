/* tslint:disable */
import { Component, SystemJsNgModuleLoaderConfig } from '@angular/core';
import * as CryptoJS from 'crypto-js'
import { load } from '@angular/core/src/render3';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'hashfile';
  hashoffile='';
  constructor(){};
  public chunkSize:number=1024*1024;
  public previous = []
  private lastOffset = 0
  onFileChange(event){
    if(event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      const chunkSize = this.chunkSize;
      var counter=0;
      var self=this;
      var SHA256 = CryptoJS.algo.SHA256.create();
      this.loading(file, (data)=>{
        var wordBuffer = CryptoJS.lib.WordArray.create(data);
        SHA256.update(wordBuffer);
      },()=>{
        var hashstring=SHA256.finalize().toString()
        this.hashoffile=hashstring
        console.log('Hash:',hashstring)
      })
    }
  }
  loading(file:any, callbackProgress, callbackFinal) {
    var offset     = 0;
    var size=this.chunkSize;
    var partial;
    var index = 0;
    var self=this;
    if(file.size===0){
      callbackFinal();
    }
    while (offset < file.size) {
      partial = file.slice(offset, offset+size);
      let reader = new FileReader;
      reader.readAsArrayBuffer(partial);
      reader.onloadend = (function(obj,size,offset,index){
        return function(evt){
          var obj:any;
          obj=this
          obj.size = size;/// TS_IGNORE
          obj.offset = offset;
          obj.index = index;
          self.callbackRead(obj, file, evt, callbackProgress, callbackFinal);
        }
      })(this,size,offset,index)
      offset += size;
      index += 1;
    }
  }
  callbackRead(obj, file, evt, callbackProgress, callbackFinal){
    this.callbackRead_buffered(obj, file, evt, callbackProgress, callbackFinal);
  }
  callbackRead_buffered(reader, file, evt, callbackProgress, callbackFinal){
    if(this.lastOffset !== reader.offset){
        // out of order
        
        console.log("[",reader.size,"]",reader.offset,'->', reader.offset+reader.size,">>buffer");
        this.previous.push({ offset: reader.offset, size: reader.size, result: reader.result});
        return;
    }
    function parseResult(obj, offset, size, result) {
      obj.lastOffset = offset + size;
      callbackProgress(result);
      if (offset + size >= file.size) {
        obj.lastOffset = 0;
        callbackFinal();
      }
    }

  // in order
    console.log("[",reader.size,"]",reader.offset,'->', reader.offset+reader.size,"");
    parseResult(this,reader.offset, reader.size, reader.result);

    // resolve previous buffered
    var buffered = [{}]
    var self=this;
    while (buffered.length > 0) {
      buffered = self.previous.filter(item => item.offset === self.lastOffset);
      buffered.forEach(function (item:any) {
          console.log("[", item.size, "]", item.offset, '->', item.offset + item.size, "<<buffer");
          parseResult(self,item.offset, item.size, item.result);
          self.previous=self.previous.filter(item1 => item1!==item)
      })
    }
  }
}
