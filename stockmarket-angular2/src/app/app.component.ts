import {Component} from '@angular/core';
import {applyPatch} from 'fast-json-patch';
import {StreamDataIo, StreamdataProxyError, StreamdataUrlSubscriber} from 'streamdataio-js-sdk';
import {StockMarket} from '../shared/StockMarket';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // Private
  private subscriber: StreamdataUrlSubscriber;
  // Public for bunding
  subscriberKey: string;
  url: string = 'http://stockmarket.streamdata.io/v2/prices';
  result: StockMarket[];

  public connect(): void {

    if (this.isConnected) {
      this.subscriber.close();
    }

    this.subscriber = StreamDataIo.subscribeToUrl(this.url, this.subscriberKey);
    //TODO Should be remove when proxy v2 is in production
    this.subscriber.proxy = 'http://haproxy-integ.streamdata.io';

    this.subscriber
      .onOpen(() => {
        // you can also add custom behavior when the stream is opened
        console.log('open');
        this.result = [];
      })
      .onData((data: StockMarket[]) => {
        // initialize your data with the initial snapshot
        console.log('--------------- on data ---------------');
        console.log('data: %o', data);
        this.result = data;
        console.log('--------------- end on data ---------------');

      })
      .onPatch((patch) => {
        // update the data with the provided patch// update the data with the provided patch
        console.log('--------------- on patch ---------------');
        console.log('patch: %o', patch);

        applyPatch(this.result, patch);

        console.log('result patched:');
        console.log('--------------- end on patch ---------------');

      })
      .onError((error: StreamdataProxyError) => {
        // do whatever you need in case of error
        console.log('error: %o', error);
        this.subscriber.close();
      });

    this.subscriber.open();
  }

  public disconnect(): void {
    this.subscriber && this.subscriber.close();
    this.subscriber = null;
  }

  public get isConnected(): boolean {
    return this.subscriber && this.subscriber.isConnected();
  }

}
