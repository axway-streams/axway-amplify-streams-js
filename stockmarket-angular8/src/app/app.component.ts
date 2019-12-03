import {Component} from '@angular/core';
import {StreamData, StreamDataError, StreamDataIo} from 'streamdataio-js-sdk';
import {applyPatch} from 'fast-json-patch';
import {StockMarket} from '../shared/StockMarket';
import {cloneDeep} from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  // Private
  private streamData: StreamData;
  // Public for bunding
  dataSource;
  token: string = "<YOUR STREAMDATA TOKEN>";

  url: string = "http://stockmarket.streamdata.io/v2/prices";
  result: StockMarket[];
  previousResult: StockMarket[];

  columns: Array<any> = [
    { name: 'title',   label: 'Title' },
    { name: 'company', label: 'Company' },
    { name: 'ticker',  label: 'Ticker' },
    { name: 'source',  label: 'Source' },
    { name: 'last',    label: 'Last' },
    { name: 'dt',      label: 'Timestamp' },
    { name: 'volume',  label: 'Volume' }
  ];

  displayedColumns: string[] = this.columns.map(column => column.name);

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
        console.log('--------------- stream opened ---------------');
        // you can also add custom behavior when the stream is opened
        this.updatePreviousResult([]);
        this.result = [];
      })
      .onData((data: StockMarket[]) => {
        console.log('--------------- snapshot received ---------------');
        this.updatePreviousResult(data);
        // initialize your data with the initial snapshot
        this.result = data;
      }, this)
      .onPatch((patch) => {
        console.log('--------------- patch received ---------------');
        this.updatePreviousResult(this.result);
        // update the data with the provided patch
        applyPatch(this.result, patch);
      }, this)
      .onError((error: StreamDataError) => {
        console.log('--------------- error received ---------------');
        // do whatever you need in case of error
        console.log('error: %o', error);
        this.streamData.close();
        console.log('--------------- stream closed ---------------');
      });

    this.streamData.open();
  }

  public updatePreviousResult(value: StockMarket[]): void {
    // Store values to enable changes indicators
    this.previousResult = cloneDeep(value);

    setTimeout(() => {
      // Forgot previous values to disable changes indicators
      this.previousResult = this.result;
    }, 1000);

  }

  public disconnect(): void {
    this.streamData && this.streamData.close();
    this.streamData = null;
  }

  public get isConnected(): boolean {
    return !!this.streamData && this.streamData.isConnected();
  }

}
