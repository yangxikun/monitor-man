<template>
  <div>
    <div class="row">
      <div class="col-12">
        <h4 style="text-align: center;">{{collection.name}}</h4>
        <p>{{collection.description}}</p>
        <table class="table">
          <tbody>
          <tr>
            <td>interval</td>
            <td>{{collection.interval}}ms</td>
          </tr>
          <tr>
            <td>reserved date</td>
            <td>{{collection.reserved}}day</td>
          </tr>
          <tr>
            <td>iterationCount</td>
            <td>{{collection.newmanOption.iterationCount}}</td>
          </tr>
          <tr>
            <td>timeoutRequest</td>
            <td>{{collection.newmanOption.timeoutRequest}}ms</td>
          </tr>
          <tr>
            <td>delayRequest</td>
            <td>{{collection.newmanOption.delayRequest}}ms</td>
          </tr>
          <tr>
            <td>ignoreRedirects</td>
            <td>{{collection.newmanOption.ignoreRedirects}}</td>
          </tr>
          <tr>
            <td>insecure</td>
            <td>{{collection.newmanOption.insecure}}</td>
          </tr>
          <tr>
            <td>bail</td>
            <td>{{collection.newmanOption.bail}}</td>
          </tr>
          <tr>
            <td>collection file</td>
            <td>
              <a :href="downloadLink('collectionFile')">Download</a>
            </td>
          </tr>
          <tr>
            <td>
              {{collection.status}}
            </td>
            <td>
              <a v-if="collection.iterationData" :href="downloadLink('iterationData')">Download iterationData</a>
              <a v-if="collection.environment" :href="downloadLink('environment')">Download environment</a>
            </td>
          </tr>
          <tr>
            <td>
              start time:
              <input class="form-control" type="text" v-model="startTime" style="width: auto;display: inline-block;">
            </td>
            <td>
              end time:
              <input class="form-control" type="text" v-model="endTime" style="width: auto;display: inline-block;">
              <button type="button" class="btn btn-outline-primary" v-on:click="go()" style="float: right;cursor: pointer;">Go</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="row" style="margin-bottom: 50px;">
      <div class="col-5">
        <table class="table" v-if="assertionsFailures">
          <thead>
            <tr>
              <th colspan="2" style="text-align: center">Assertions Failures</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(count, name) in assertionsFailures">
              <td>{{name}}</td>
              <td>{{count}}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="col-2"></div>
      <div class="col-5">
        <table class="table" v-if="testScriptsFailures">
          <thead>
          <tr>
            <th colspan="2" style="text-align: center">TestScripts Failures</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(count, name) in testScriptsFailures">
            <td>{{name}}</td>
            <td>{{count}}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="row" v-show="!showLine">
      <h1 style="margin: auto;color: #9e9e9e;">Loading...</h1>
    </div>
    <show-line-chart v-if="showLine" :collectionId="collectionId" :summary="summaries"></show-line-chart>
  </div>
</template>

<script>
  import ShowLineChart from './ShowLineChart'

  export default {
    name: 'collectionShow',
    components: {
      ShowLineChart,
    },
    data() {
      // from: http://www.cnblogs.com/zhangpengshou/archive/2012/07/19/2599053.html
      Date.prototype.Format = function (fmt) { //author: meizz
        const o = {
          "M+": this.getMonth() + 1, //月份
          "d+": this.getDate(), //日
          "H+": this.getHours(), //小时
          "m+": this.getMinutes(), //分
          "s+": this.getSeconds(), //秒
          "q+": Math.floor((this.getMonth() + 3) / 3), //季度
          "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (let k in o)
          if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
      };
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 2*3600*1000);
      return {
        collectionId: this.$route.params.id,
        startTime: startTime.Format("yyyy-MM-dd HH:mm:ss"),
        endTime: endTime.Format("yyyy-MM-dd HH:mm:ss"),
        collection: {newmanOption: {}},
        summaries: [],
        assertionsFailures: null,
        testScriptsFailures: null,
        showLine: false,
        errModal: {
          show: false
        },
      }
    },
    mounted() {
      const collectionId = this.$route.params.id;
      this.$http.get('/collection/'+collectionId)
        .then(resp => {
          this.collection = resp.data;
          this.go();
        }).catch(error => {
          this.$bus.$emit('error', 'http request: '+'/collection/'+collectionId, error.message);
        });
    },
    methods: {
      go() {
        const s = (new Date(this.startTime)).getTime();
        if (isNaN(s)) {
          this.$bus.$emit('error', 'time picker', 'invalid startTime: ' + this.startTime);
          return;
        }
        const e = (new Date(this.endTime)).getTime();
        if (isNaN(e)) {
          this.$bus.$emit('error', 'time picker', 'invalid endTime: ' + this.endTime);
          return;
        }
        const collectionId = this.$route.params.id;
        const uri = '/collection/'+collectionId+'/summaries?s='+s+'&e='+e;
        this.$http.get(uri)
          .then(resp => {
            this.update(resp.data, true);
          }).catch(error => {
            this.$bus.$emit('error', 'http request: '+uri, error.message);
          });
      },
      update(summaries, jsonParse) {
        let assertionsFailures = {};
        let testScriptsFailures = {};
        for (let index in summaries) {
          if (jsonParse) {
            summaries[index] = JSON.parse(summaries[index]);
          }
          let failures = summaries[index].assertions.failures;
          for (let id in failures) {
            const key = failures[id];
            if (assertionsFailures[key]) {
              assertionsFailures[key]++;
            } else {
              assertionsFailures[key] = 1;
            }
          }
          failures = summaries[index].testScripts.failures;
          for (let id in failures) {
            const key = failures[id];
            if (testScriptsFailures[key]) {
              testScriptsFailures[key]++;
            } else {
              testScriptsFailures[key] = 1;
            }
          }
        }
        if (Object.keys(assertionsFailures).length > 0) {
          this.assertionsFailures = assertionsFailures;
        } else {
          this.assertionsFailures = null;
        }
        if (Object.keys(testScriptsFailures).length > 0) {
          this.testScriptsFailures = testScriptsFailures;
        } else {
          this.testScriptsFailures = null;
        }

        this.summaries = summaries;
        this.showLine = true;
      },
      downloadLink(type) {
        return "/collection/" + this.collectionId + "/download/" + type;
      },
    }
  }
</script>
