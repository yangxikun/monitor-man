<template>
  <div style="margin-bottom: 50px;">
    <line-chart :chart-data="lineDataCollection" :options="{responsive: true, maintainAspectRatio: false}" style="max-height: 20rem"></line-chart>
    <line-chart :chart-data="failLineDataCollection" :options="{responsive: true, maintainAspectRatio: false}" style="max-height: 20rem"></line-chart>
    <div style="margin: auto;">
      <table class="table table-striped">
        <thead>
        <tr>
          <th>started</th>
          <th>completed</th>
          <th>cost(ms)</th>
          <th>assertions success</th>
          <th>assertions failed</th>
          <th>testScripts success</th>
          <th>testScripts failed</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in pagingSummary.data">
          <td>{{item.started}}</td>
          <td>{{item.completed}}</td>
          <td>{{item.cost}}</td>
          <td>{{item.assertions.success}}</td>
          <td class="failure" v-if="item.assertions.failed > 0" v-on:click="showFailures(collectionId, item.assertions.failures, 'Assertions Failures')">{{item.assertions.failed}}</td>
          <td v-else>0</td>
          <td>{{item.testScripts.success}}</td>
          <td class="failure" v-if="item.testScripts.failed > 0" v-on:click="showFailures(collectionId, item.testScripts.failures, 'TestScripts Failures')">{{item.testScripts.failed}}</td>
          <td v-else>0</td>
        </tr>
        </tbody>
      </table>
      <div style="text-align: center;">
          <button type="button" class="click btn btn-outline-primary" :disabled="pagingSummary.page == 1" v-on:click="paging(-1)">Last</button>
          <button type="button" class="click btn btn-outline-primary" :disabled="pagingSummary.page == pagingSummary.totalPage" v-on:click="paging(1)">Next</button>
      </div>
    </div>
    <modal :collectionInfo="modal.collectionInfo" :title="modal.title" :show="modal.show" :failures="modal.failures" v-on:close="modal.show = false"></modal>
  </div>
</template>

<script>
  import Modal from '../modal/JsonViewModal'
  import LineChart from '../charts/Line'

  export default {
    name: 'collectionShowChart',
    components: {
      Modal,
      LineChart
    },
    props: ['collectionId', 'summary'],
    data() {
      return {
        lineDataCollection: null,
        failLineDataCollection: null,
        pagingSummary: {
          data: [],
          page: 1,
          totalPage: 1,
          count: 10
        },
        modal: {
          show: false
        },
      };
    },
    watch: {
      summary(newSummary) {
        this.update(newSummary);
      }
    },
    mounted() {
      this.update(this.summary);
    },
    methods: {
      paging(step) {
        this.pagingSummary.page += step;
        let start = (this.pagingSummary.page - 1)*this.pagingSummary.count;
        this.pagingSummary.data = this.summary.slice(start, start + this.pagingSummary.count)
      },
      update(summary) {
        let lineX = [];
        let costLineY = [];
        let assertionsLineY = [];
        let testScriptsLineY = [];
        for (let index in summary) {
          lineX.push(summary[index].completed);
          costLineY.push(summary[index].cost);
          assertionsLineY.push(summary[index].assertions.failed);
          testScriptsLineY.push(summary[index].testScripts.failed);
        }
        this.lineDataCollection = {
          labels: lineX,
          datasets: [
            {
              label: 'cost(ms)',
              backgroundColor: '#' + Math.random().toString(16).slice(2, 8),
              data: costLineY
            }
          ]
        };
        const assertionsFailuresColor = '#' + Math.random().toString(16).slice(2, 8);
        const testScriptsFailuresColor = '#' + Math.random().toString(16).slice(2, 8);
        this.failLineDataCollection = {
          labels: lineX,
          datasets: [
            {
              label: 'assertions failures count',
              backgroundColor: assertionsFailuresColor,
              borderColor: assertionsFailuresColor,
              data: assertionsLineY,
              fill: false
            },
            {
              label: 'testScripts failures count',
              backgroundColor: testScriptsFailuresColor,
              borderColor: testScriptsFailuresColor,
              data: assertionsLineY,
              data: testScriptsLineY,
              fill: false
            }
          ]
        };
        this.pagingSummary.totalPage = Math.ceil(this.summary.length / this.pagingSummary.count);
        this.pagingSummary.page = 1;
        this.paging(0);
      },
      showFailures(id, failures, title) {
        this.modal.failures = failures;
        this.modal.show = true;
        this.modal.title = title;
        this.modal.collectionInfo = {
          id: id,
        };
      },
    }
  }
</script>

<style lang="stylus" scoped>
  .failure
    cursor: pointer
    background-color: #ffd0d0
  .click
    cursor: pointer
</style>
