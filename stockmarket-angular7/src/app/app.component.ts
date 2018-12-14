import {Component} from '@angular/core';
import {StreamData, StreamDataError, StreamDataIo} from 'streamdataio-js-sdk';
import {applyPatch} from 'fast-json-patch';
import {StockMarket} from '../shared/StockMarket';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // Private
  private streamData: StreamData;
  // Public for bunding
  token: string = "<YOUR STREAMDATA TOKEN>";
  url: string = "http://stockmarket.streamdata.io/v2/prices";
  result: StockMarket[];

  public connect(): void {

    // If ever you wish to get the whole data instead of patches:
    // headers = ["Accept: application/json"];
    let headers = [];

    if (this.isConnected) {
      this.streamData.close();
    }

    this.streamData = StreamDataIo.createEventSource(this.url, this.token, headers);

    this.streamData
      .onOpen(() => {
        // you can also add custom behavior when the stream is opened
        console.log('open');
        this.result = [];
      })
      .onData((data: StockMarket[]) => {
        // initialize your data with the initial snapshot
        console.log('--------------- on data ---------------');
        console.log('data: ' + data);
        this.result = data;
        console.log('--------------- end on data ---------------');

      }, this)
      .onPatch((patch) => {
        // update the data with the provided patch// update the data with the provided patch
        console.log('--------------- on patch ---------------');
        //  console.log('patch: %o', patch);
        console.log('patch:');

        applyPatch(this.result, patch);

        console.log('result patched:');
        console.log('--------------- end on patch ---------------');

      }, this)
      .onError((error: StreamDataError) => {
        // do whatever you need in case of error
        console.log('error: %o', error);
        this.streamData.close();
      });

    this.streamData.open();
  }

  public disconnect(): void {
    this.streamData && this.streamData.close();
    this.streamData = null;
  }

  public get isConnected(): boolean {
    return !!this.streamData && this.streamData.isConnected();
  }

}
