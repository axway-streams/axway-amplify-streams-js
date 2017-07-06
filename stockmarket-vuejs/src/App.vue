<template>
  <div id="app">
    <streamdataio></streamdataio>
  </div>
</template>

<script>
import Streamdataio from './components/Streamdataio'

export default {
  name: 'app',
  components: {
    Streamdataio
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
