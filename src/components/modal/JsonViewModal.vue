<template>
  <div v-show="show">
    <div class="modal fade show" tabindex="-1" role="dialog" style="display: block;">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{title}}</h5>
            <button type="button" class="close" v-on:click="close()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div>
              <select v-model="failureSelected" style="height: 2.2rem">
                <option :value="id" v-for="(name, id, index) in failures">{{name}}</option>
              </select>
            </div>
            <div class="json-view" v-show="failureData">
              <tree-view :data="failureData" :options="{maxDepth: 3}"></tree-view>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  </div>
</template>

<script>
  export default {
    props: {
      title: String,
      failures: Object,
      show: Boolean,
      collectionInfo: Object
    },
    data() {
      return {
        failureSelected: null,
        failureData: null
      };
    },
    watch: {
      failures(val) {
        this.failureSelected = Object.keys(val)[0];
        document.body.classList.add('modal-open');
      },
      failureSelected(id) {
        const uri = '/collection/'+this.collectionInfo.id+'/failure/' + id;
        this.$http.get(uri).then(resp => {
          this.failureData = resp.data;
        }).catch(error => {
          this.$bus.$emit('error', 'http request: ' + uri, error.message)
        });
      }
    },
    methods: {
      close() {
        this.$emit('close');
        document.body.classList.remove('modal-open');
      }
    }
  }
</script>

<style lang="stylus" scoped>
  select
    background-color: #fff
    padding: 0.25rem
    border-radius: 0.2rem
  .modal-dialog
    min-width: 50%
  .json-view
    overflow-y: scroll
    max-height: 75vh
    margin: 20px 10px
</style>

<style lang="stylus">
  .tree-view-item-value-string
    white-space: normal
  body.modal-open {
    overflow: hidden;
  }
</style>
