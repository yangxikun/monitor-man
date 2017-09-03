<template>
  <div v-show="show">
    <div class="modal fade show" tabindex="-1" role="dialog" style="display: block;">
      <div class="modal-dialog" role="document">
        <div class="modal-content" style="top: 10rem;">
          <div class="modal-header">
            <h5 class="modal-title">{{title}}</h5>
            <button type="button" class="close" v-on:click="close()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            {{message}}
          </div>
          <div class="modal-footer">
            <button type="button" class="click btn btn-primary" v-on:click="confirm()">Confirm</button>
            <button type="button" class="click btn btn-secondary" v-on:click="close()">Cancel</button>
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
      message: String
    },
    data() {
      return {};
    },
    methods: {
      close() {
        this.$emit('close');
      },
      confirm() {
        this.$emit('confirm');
      }
    }
  }
</script>

<style lang="stylus" scoped>
  .modal-dialog
    max-height: 50%
  .click
    cursor: pointer
</style>
