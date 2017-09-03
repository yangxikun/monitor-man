<template>
  <div v-show="show">
    <div class="modal fade show" tabindex="-1" role="dialog" style="display: block;">
      <div class="modal-dialog" role="document">
        <div class="modal-content" style="top: 10rem;">
          <div class="modal-header alert alert-warning">
            <h5 class="modal-title">{{title}}</h5>
            <button type="button" class="close" v-on:click="close()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div v-show="messageString">
              {{messageString}}
            </div>
            <div class="json-view" v-show="messageJson">
              <tree-view :data="messageJson" :options="{maxDepth: 3}"></tree-view>
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
      show: Boolean,
      message: [String, Array, Object],
    },
    data() {
      return {
        messageString: "",
        messageJson: null
      };
    },
    watch: {
      message(val) {
        if (typeof val === "string") {
          this.messageString = val;
          this.messageJson = null;
        } else {
          this.messageString = "";
          this.messageJson = val;
        }
      }
    },
    methods: {
      close() {
        this.$emit('close');
      }
    }
  }
</script>

<style lang="stylus" scoped>
  .modal-dialog
    max-width: 50%
    max-height: 50%
</style>
