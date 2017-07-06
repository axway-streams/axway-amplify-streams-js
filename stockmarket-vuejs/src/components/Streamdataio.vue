<template>
  <div class="container">
    <div class="header">
      <img src="../assets/streamdataio.png" />
      <h3 class="header-title">Stock-Market demo with <img width="100"
                                                           src="../assets/vuejs.png" />
      </h3>
    </div>
    <div class="content">
      <h4>An application token is required for authentication. <a href="https://portal.streamdata.io/#/register"
                                                                  target="_blank">Sign Up</a> to get yours.</h4>
      <div class="form">
        <md-input-container class="input-full">
          <input mdInput placeholder="URL" name="urlInput" v-model="url" disabled>
        </md-input-container>
        <md-input-container class="input-full">
          <input mdInput placeholder="Token" name="token" v-model="token" :disabled="isConnected">
        </md-input-container>
        <div class="actions">
          <div v-if="!isConnected">
            <md-button class="md-fab" v-on:click="connect()">
              <md-icon>play_arrow</md-icon>
            </md-button>
          </div>
          <div v-if="isConnected">
            <md-button class="md-fab" v-on:click="disconnect()">
              <md-icon>stop</md-icon>
            </md-button>
          </div>
        </div>
      </div>
      <div class="table" v-if="isConnected">
        <md-progress md-indeterminate></md-progress>
        <md-table>
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
    </div>
  </div>
</template>

<script>
  import  {StreamDataIo} from 'streamdataio-js-sdk'
  import * as jsonpatch from 'fast-json-patch'

  export default {
    name   : 'hello',
    data () {
      return {
        url        : 'http://stockmarket.streamdata.io/prices',
        token      : null,
        tableData  : [],
        streamData : null,
        isConnected: false
      }
    },
    methods: {
      connect    : function ()
      {
        this.streamData =
          StreamDataIo.createEventSource(this.url, this.token, []);
        this.streamData.onData(data =>
        {
          // initialize your data with the initial snapshot
          console.log('Received data');
          console.table(data);
          this.tableData = data;
          console.table(this.tableData);
        },this).onPatch(patch =>
        {
          // update the data with the provided patch// update the data with the provided patch
          console.log('received patch %o', patch);
          jsonpatch.applyPatch(this.tableData, patch);
          console.table(this.tableData);
        },this).onError(error =>
        {
          // do whatever you need in case of error
          console.log('error: %o', error);
          this.streamData.close();
          this.isConnected = false;
        },this).onOpen(function ()
        {
          this.isConnected = true;
          // you can also add custom behavior when the stream is opened
          console.log('open');
        },this);
        this.streamData.open();
      },
      disconnect : function ()
      {
        if (this.streamData) {
          this.streamData.close();
        }
        this.isConnected = false;
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .container {
    display: flex;
    flex-direction: column;
  }

  .progress {
    width: 100%;
    margin-bottom: 10px;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    flex-direction: column;
    border-bottom: 1px solid #e5e5e5;
  }

  .header .header-title {
    display: flex;
    align-items: center;
  }

  /* Content */
  .content {
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-top: 10px;
  }

  .content .form {
    width: 50%;
    padding: 30px;
  }

  .content .form .input-full {
    width: 100%;
  }

  .content .form .md-input-container input, .content .form .md-input-container textarea {
    font-size: inherit;
  }

  .content .form .actions {
    display: flex;
    justify-content: flex-end;
  }

  .content .table {
    padding: 30px;
  }

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
