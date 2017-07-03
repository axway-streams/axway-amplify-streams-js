<template>
  <div class="hello">
    <h1>Streamdata.io sample</h1>
    <button v-on:click="hello" v-if="!isConnected">Start streaming</button>
    <button v-on:click="goodbye" v-if="isConnected">Stop streaming</button>
    <md-table v-if="tableData.length > 0">
      <md-table-header>
        <md-table-row>
          <md-table-head>Title</md-table-head>
          <md-table-head md-numeric>Price</md-table-head>
          <md-table-head md-numeric>Param1</md-table-head>
          <md-table-head md-numeric>Param2</md-table-head>
          <md-table-head md-numeric>Param3</md-table-head>
          <md-table-head md-numeric>Param4</md-table-head>
          <md-table-head md-numeric>Param5</md-table-head>
          <md-table-head md-numeric>Param6</md-table-head>
          <md-table-head md-numeric>Param7</md-table-head>
          <md-table-head md-numeric>Param8</md-table-head>
        </md-table-row>
      </md-table-header>

      <md-table-body>
        <md-table-row v-for="(data, index) in tableData" :key="data.title">
          <md-table-cell v-for="col in data" :key="col.title" md-numeric>{{col}}</md-table-cell>
        </md-table-row>
      </md-table-body>
    </md-table>
  </div>
</template>

<script>
import  { StreamDataIo } from 'streamdataio-js-sdk'
import * as jsonpatch from 'fast-json-patch'

export default {
  name: 'hello',
  data () {
    return {
      tableData: [],
      isConnected: false,
      eventSource: {}
    }
  },
  methods: {
    hello: function() {
      this.isConnected = true;
      this.eventSource = StreamDataIo.createEventSource("http://stockmarket.streamdata.io/prices", "YjAwNDYwYzItN2Y1Mi00YmM5LTk3NmUtN2I4OGNhOGFiMzhj", []);
      this.eventSource.onData(data => {
        // initialize your data with the initial snapshot
        console.log('Received data');
        console.table(data);
        this.tableData = data;
        console.table(this.tableData);
      }).onPatch(patch => {
        // update the data with the provided patch// update the data with the provided patch
        console.log('received patch %o', patch);
        jsonpatch.applyPatch(this.tableData, patch);
        console.table(this.tableData);
      }).onError(error =>{
        // do whatever you need in case of error
        console.log('error: %o', error);
        this.eventSource.close();
        this.isConnected = false;
      }).onOpen(function(){
        // you can also add custom behavior when the stream is opened
        console.log('open');
      });
      this.eventSource.open();
    },
    goodbye: function() {
      this.eventSource.close();
      this.isConnected = false;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
