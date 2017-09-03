<template>
  <div style="margin-bottom: 50px;">
    <h3 style="background-color: #f8f8f8;line-height: 3.5;text-align: center;"><span style="color: red;">Edit</span> {{form.name}}</h3>
    <form v-on:submit.prevent="submit">
      <div class="form-group">
        <label>name</label>
        <input v-model="form.name" type="text" class="form-control" style="width: auto">
      </div>
      <div class="form-group">
        <label>description</label>
        <textarea class="form-control" rows="5" v-model="form.description"></textarea>
      </div>
      <div class="form-group">
        <label>javascript code</label>
        <editor v-on:content-update="syncCode" :sync="true" :content="form.code" :theme="'monokai'" :height="'40rem'"></editor>
        <p class="form-text text-muted">handler code will be run in <a href="https://www.npmjs.com/package/safe-eval">safe-eval</a>, injected variable can be used:
          <a href="https://nodejs.org/api/console.html">console</a>,
          <a href="https://www.npmjs.com/package/redis">redis</a>,
          <a href="https://www.npmjs.com/package/postman-request">request</a>,
          <a href="https://www.npmjs.com/package/date-and-time">date</a>,
          <a href="https://www.npmjs.com/package/sprintf-js">sprintf/vsprintf</a>,
          handlerParams, failures
        </p>
      </div>
      <button type="submit" class="btn btn-primary mm-click">Submit</button>
      <div v-on:click="debug" class="btn btn-secondary mm-click">Debug</div>
    </form>
    <div style="margin-top: 2rem;">
      <h4>Debug Result (example <span class="mm-click" style="color: #0275d8" v-on:click="showExampleSummary = true">failures</span>)</h4>
      <p>
        {{debugResult}}
      </p>
    </div>
    <div v-show="showExampleSummary">
      <div class="modal fade show" tabindex="-1" role="dialog" style="display: block;">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Example Summary</h5>
              <button type="button" class="close" v-on:click="showExampleSummary = false">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="json-view">
                <tree-view :data="failures" :options="{maxDepth: 3}"></tree-view>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<script>
  import editor from 'vue-brace'
  import 'brace/mode/javascript'
  import 'brace/theme/monokai'

  export default {
    name: 'handlerCreate',
    components: {
      editor
    },
    data() {
      const handlerId = this.$route.params.id;
      const failures = JSON.parse('{"fcb42aa3-979c-4727-941e-32af45e515eb":{"failures":[{"error":{"name":"AssertionFailure","index":1,"message":"Status code is not 200","stack":"AssertionFailure: Expected tests[\\"Status code is not 200\\"] to be true-like\\n   at Object.eval test.js:2:1)","checksum":"7e996e6ca03a0ddc3e4d53524636a1ec","id":"0a5e556c-80dd-41fa-908c-47587c34bbd8","timestamp":1504343055227,"stacktrace":[{"fileName":"test.js","lineNumber":2,"functionName":"Object.eval","typeName":"Object","methodName":"eval","columnNumber":1,"native":false}]},"at":"assertion:1 in test-script","source":{"id":"58b137ed-1e88-453f-8405-685e09186509","name":"Test Assertion","request":{"url":"http://abc.com/test","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["tests[\\"Status code is not 200\\"] = responseCode.code !== 200;"],"_lastExecutionId":"e5dc068a-e38a-4a5c-9365-fded0ae4c3ea"}}]},"parent":{"info":{"id":"c3a34a9d-a660-83a5-223a-54afb11ace02","name":"Test abc.com","schema":"https://schema.getpostman.com/json/collection/v2.0.0/collection.json"},"event":[],"variable":[],"item":[{"id":"58b137ed-1e88-453f-8405-685e09186509","name":"Test Assertion","request":{"url":"http://abc.com/test","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["tests[\\"Status code is not 200\\"] = responseCode.code !== 200;"],"_lastExecutionId":"e5dc068a-e38a-4a5c-9365-fded0ae4c3ea"}}]},{"id":"4a6e6124-17f3-4d35-a606-4982dda5c77a","name":"Test Script Failures","request":{"url":"http://abc.com","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["var jsonData = JSON.parse(responseBody);","tests[\\"Your test name\\"] = jsonData.value === 100;"],"_lastExecutionId":"acbea48a-825f-49fe-a62d-5db616e3d2a0"}}]}]},"cursor":{"position":0,"iteration":0,"length":2,"cycles":1,"empty":false,"eof":false,"bof":true,"cr":false,"ref":"fcb42aa3-979c-4727-941e-32af45e515eb"}}],"execution":{"cursor":{"position":0,"iteration":0,"length":2,"cycles":1,"empty":false,"eof":false,"bof":true,"cr":false,"ref":"fcb42aa3-979c-4727-941e-32af45e515eb"},"item":{"id":"58b137ed-1e88-453f-8405-685e09186509","name":"Test Assertion","request":{"url":"http://abc.com/test","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["tests[\\"Status code is not 200\\"] = responseCode.code !== 200;"],"_lastExecutionId":"e5dc068a-e38a-4a5c-9365-fded0ae4c3ea"}}]},"request":{"url":"http://abc.com/test","method":"GET","header":[{"key":"User-Agent","value":"PostmanRuntime/6.2.5"},{"key":"Accept","value":"*/*"},{"key":"Host","value":"abc.com"},{"key":"accept-encoding","value":"gzip, deflate"}],"body":{},"description":{"content":"","type":"text/plain"}},"response":{"id":"d84c359e-59f7-4133-a803-a4a28ca99351","status":"OK","code":200,"header":[{"key":"Server","value":"openresty"},{"key":"Date","value":"Sat, 02 Sep 2017 09:04:15 GMT"},{"key":"Content-Type","value":"application/json; charset=utf-8"},{"key":"Transfer-Encoding","value":"chunked"},{"key":"Connection","value":"keep-alive"}],"stream":"[\\"天气\\",[\\"天气预报\\",\\"天气预报15天查询\\",\\"天气查询\\",\\"天气预报查询一周\\",\\"天气预报查询一周15天\\",\\"天气通\\"]]\\n","cookie":[],"responseTime":40,"responseSize":140},"id":"58b137ed-1e88-453f-8405-685e09186509","assertions":[{"assertion":"Status code is not 200","error":{"name":"AssertionFailure","index":1,"message":"Status code is not 200","stack":"AssertionFailure: Expected tests[\\"Status code is not 200\\"] to be true-like\\n   at Object.eval test.js:2:1)"}}]}},"0f661e64-2e66-4219-9300-7ebc50e79257":{"failures":[{"error":{"type":"Error","name":"JSONError","message":"Unexpected token \'<\' at 1:1\\n<html>\\n^","checksum":"b7db65fd7db5667f384af70acdddcfb0","id":"a5662684-90e6-4606-937f-507bfb530e01","timestamp":1504343055274,"stacktrace":[]},"at":"test-script","source":{"id":"4a6e6124-17f3-4d35-a606-4982dda5c77a","name":"Test Script Failures","request":{"url":"http://abc.com","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["var jsonData = JSON.parse(responseBody);","tests[\\"Your test name\\"] = jsonData.value === 100;"],"_lastExecutionId":"acbea48a-825f-49fe-a62d-5db616e3d2a0"}}]},"parent":{"info":{"id":"c3a34a9d-a660-83a5-223a-54afb11ace02","name":"Test abc.com","schema":"https://schema.getpostman.com/json/collection/v2.0.0/collection.json"},"event":[],"variable":[],"item":[{"id":"58b137ed-1e88-453f-8405-685e09186509","name":"Test Assertion","request":{"url":"http://abc.com/test","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["tests[\\"Status code is not 200\\"] = responseCode.code !== 200;"],"_lastExecutionId":"e5dc068a-e38a-4a5c-9365-fded0ae4c3ea"}}]},{"id":"4a6e6124-17f3-4d35-a606-4982dda5c77a","name":"Test Script Failures","request":{"url":"http://abc.com","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["var jsonData = JSON.parse(responseBody);","tests[\\"Your test name\\"] = jsonData.value === 100;"],"_lastExecutionId":"acbea48a-825f-49fe-a62d-5db616e3d2a0"}}]}]},"cursor":{"ref":"0f661e64-2e66-4219-9300-7ebc50e79257","length":2,"cycles":1,"position":1,"iteration":0}}],"execution":{"cursor":{"ref":"0f661e64-2e66-4219-9300-7ebc50e79257","length":2,"cycles":1,"position":1,"iteration":0},"item":{"id":"4a6e6124-17f3-4d35-a606-4982dda5c77a","name":"Test Script Failures","request":{"url":"http://abc.com","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["var jsonData = JSON.parse(responseBody);","tests[\\"Your test name\\"] = jsonData.value === 100;"],"_lastExecutionId":"acbea48a-825f-49fe-a62d-5db616e3d2a0"}}]},"request":{"url":"http://abc.com","method":"GET","header":[{"key":"User-Agent","value":"PostmanRuntime/6.2.5"},{"key":"Accept","value":"*/*"},{"key":"Host","value":"abc.com"},{"key":"accept-encoding","value":"gzip, deflate"}],"body":{},"description":{"content":"","type":"text/plain"}},"response":{"id":"6c461534-02ae-4098-9026-d4f96affe71b","status":"Not Found","code":404,"header":[{"key":"Server","value":"openresty"},{"key":"Date","value":"Sat, 02 Sep 2017 09:04:15 GMT"},{"key":"Content-Type","value":"text/html"},{"key":"Content-Length","value":"162"},{"key":"Connection","value":"keep-alive"}],"stream":"<html>\\r\\n<head><title>404 Not Found</title></head>\\r\\n<body bgcolor=\\"white\\">\\r\\n<center><h1>404 Not Found</h1></center>\\r\\n<hr><center>nginx</center>\\r\\n</body>\\r\\n</html>\\r\\n","cookie":[],"responseTime":30,"responseSize":162},"id":"4a6e6124-17f3-4d35-a606-4982dda5c77a","testScript":[{"error":{"type":"Error","name":"JSONError","message":"Unexpected token \'<\' at 1:1\\n<html>\\n^","checksum":"b7db65fd7db5667f384af70acdddcfb0","id":"a5662684-90e6-4606-937f-507bfb530e01","timestamp":1504343055274,"stacktrace":[]}}]}}}');
      return {
        handlerId: handlerId,
        form: {
          name: '',
          description: '',
          code: ''
        },
        code: '',
        debugResult: '',
        failures: failures,
        showExampleSummary: false
      }
    },
    created() {
      this.$http.get('/handler/'+this.handlerId)
        .then(resp => {
          resp.data.description = resp.data.description.replace(/<br>/g, "\n");
          this.form = resp.data;
        }).catch(error => {
        this.error('http request: '+'/handler/'+this.handlerId, JSON.stringify(error));
      });
    },
    methods: {
      submit: function () {
        this.form.code = this.code;
        this.form.description = this.form.description.replace(/\n/g, "<br>");
        let formData = new FormData();
        for (let key in this.form) {
          formData.append(key, this.form[key]);
        }
        const uri = '/handler/'+this.handlerId+'/update';
        this.$http.post(uri, formData)
          .then(() => {
            this.$router.push('/handler');
          }).catch(error => {
          this.$bus.$emit('error', 'http request: ' + uri + error.message, error.response.data)
        });
      },
      syncCode: function (val) {
        this.code = val;
      },
      debug: function () {
        this.$http.post('/handler/'+this.handlerId+'/debug', {code: this.code})
          .then(resp => {
            this.debugResult = resp.data;
          }).catch(error => {
          this.debugResult = error.response.data;
        });
      }
    }
  }
</script>

<style lang="stylus" scoped>
  .modal-dialog
    max-width: 50%
    max-height: 50%
  .json-view
    overflow-y: scroll
    max-height: 80vh
    padding: 20px 10px
  .ace_editor
    font-size: 1rem
</style>
