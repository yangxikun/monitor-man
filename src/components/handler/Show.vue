<template>
  <div>
    <router-link :to="{ name: 'HandlerCreate' }">New</router-link>
    <div class="card" v-for="handler in handlers">
      <h5 class="card-header">
        {{handler.name}}
        <span v-on:click="showConfirm('Delete handler', 'delete '+handler.name, handler.id, remove)" class="mm-click" style="color: #308ede;float: right;margin-left: 10px;">
        <icon name="remove"></icon>
        </span>
        <router-link :to="{ name: 'HandlerUpdate', params: {id: handler.id} }" style="float: right;">
          <icon name="edit"></icon>
        </router-link>
      </h5>
      <div class="card-block">
        <p class="card-text" v-if="handler.description" v-html="handler.description"></p>
      </div>
    </div>
    <confirm-modal :title="confirmModal.title" :show="confirmModal.show" :message="confirmModal.message" v-on:close="confirmModal.show = false" v-on:confirm="confirmModal.callback(confirmModal)"></confirm-modal>
  </div>
</template>

<script>
  import ConfirmModal from '../modal/ConfirmModal'
  export default {
    name: 'handlerShow',
    components: {
      ConfirmModal
    },
    data() {
      return {
        handlers: [],
        confirmModal: {
          show: false,
          data: null
        }
      }
    },
    created() {
      this.fetchData();
    },
    methods: {
      fetchData() {
        const uri = '/handler';
        this.$http.get(uri)
          .then(resp => {
            this.handlers = resp.data;
          }).catch(error => {
          this.$bus.$emit('error', 'http request: ' + uri, error.message)
        });
      },
      showConfirm(title, message, data, callback) {
        this.confirmModal = {
          title: title,
          message: message,
          show: true,
          data: data,
          callback: callback
        };
      },
      remove(confirmModal) {
        confirmModal.show = false;
        const uri = '/handler/'+confirmModal.data;
        this.$http.delete(uri)
          .then(() => {
            this.fetchData();
          }).catch(error => {
          this.$bus.$emit('error', 'http request: ' + uri, error.message);
        });
      },
    }
  }
</script>

<style lang="stylus" scoped>
  a
    text-decoration: none
  .card
    margin-bottom: 20px
</style>
