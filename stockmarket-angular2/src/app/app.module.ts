import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MdButtonModule, MdIconModule, MdInputModule,MdProgressBarModule} from '@angular/material';

import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {AppComponent} from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MdInputModule,
    MdButtonModule,
    MdProgressBarModule,
    MdIconModule,
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
