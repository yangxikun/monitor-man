<template>
  <div style="margin-bottom: 50px;">
    <h3 style="background-color: #f8f8f8;line-height: 3.5;text-align: center;"><span style="color: red;">Create</span></h3>
    <p>see <a href="https://github.com/postmanlabs/newman#newmanrunoptions-object--callback-function--run-eventemitter">newman.run options</a> for more information.</p>
    <form v-on:submit.prevent="submit">
      <div class="form-group row">
        <label class="col-2 col-form-label">tag</label>
        <input v-model="form.tag" type="text" class="col-10 form-control">
        <small class="col-12 form-text text-muted">Aggregate your collection by tag, use comma to separate multi tag</small>
      </div>
      <div class="form-group row">
        <label class="col-2 col-form-label">reserved date</label>
        <input v-model="form.reserved" type="text" class="col-10 form-control">
        <small class="col-12 form-text text-muted">Collection running result reserved date</small>
      </div>
      <div class="form-group row">
        <label class="col-2 col-form-label">collection</label>
        <input v-on:change="uploadFile($event, 'collection')" class="col-10" type="file" name="collection-file">
        <small class="col-12 form-text text-muted">Postman Collection JSON file</small>
      </div>
      <div class="form-group row">
        <label class="col-2 col-form-label">interval(ms)</label>
        <input v-model="form.interval" type="text" class="col-10 form-control">
      </div>
      <div class="form-group row">
        <label class="col-2 col-form-label">timeoutRequest(ms)</label>
        <input v-model="form.timeoutRequest" type="text" class="col-10 form-control">
        <small class="col-12 form-text text-muted">0 indicate Infinity</small>
      </div>
      <div class="form-group row">
        <label class="col-2 col-form-label">delayRequest(ms)</label>
        <input v-model="form.delayRequest" type="text" class="col-10 form-control">
      </div>
      <div class="form-group row">
        <label class="col-2 col-form-label">iterationCount</label>
        <input v-model="form.iterationCount" type="text" class="col-10 form-control">
      </div>
      <div class="form-group">
        <label>iterationData</label>
        <input v-on:change="uploadFile($event, 'iterationData')" type="file">
        <small class="form-text text-muted">JSON or CSV file to be used as data source when running multiple iterations on a collection.</small>
      </div>
      <div class="form-group">
        <label>environment</label>
        <input v-on:change="uploadFile($event, 'environment')" type="file">
        <small class="form-text text-muted">Postman export environment file.</small>
      </div>
      <div class="form-group row">
        <label class="col-2 col-form-label">handler</label>
        <select class="col-2 form-control" v-model="form.handler" style="width: auto">
          <option value=""></option>
          <option :value="handler.id" v-for="handler in handlers">{{handler.name}}</option>
        </select>
        <small class="col-12 form-text text-muted">Failure handler(eg send some alert...)</small>
      </div>
      <div class="form-group">
        <label>handler params</label>
        <textarea v-model="form.handlerParams" class="form-control" rows="5"></textarea>
        <small class="form-text text-muted">Params pass to handler, must be json string.</small>
      </div>
      <div class="checkbox">
        <input v-model="form.ignoreRedirects" type="checkbox"> ignoreRedirects
        <small class="text-muted">(This specifies whether newman would automatically follow 3xx responses from servers.)</small>
      </div>
      <div class="checkbox">
        <input v-model="form.insecure" type="checkbox"> insecure
        <small class="text-muted">(Disables SSL verification checks and allows self-signed SSL certificates.)</small>
      </div>
      <div class="checkbox">
        <label>
          <input v-model="form.bail" type="checkbox"> bail
          <small class="text-muted">(Switch to specify whether or not to gracefully stop a collection run on encountering the first error.)</small>
        </label>
      </div>
      <button type="submit" class="btn btn-primary mm-click">Submit</button>
    </form>
  </div>
</template>

<script>
  export default {
    name: 'collectionCreate',
    data() {
      return {
        handlers: [],
        form: {
          reserved: 3,
          interval: 60000,
          timeoutRequest: 0,
          delayRequest: 0,
          iterationCount: 1,
          ignoreRedirects: true,
          insecure: false,
          bail: false
        },
      }
    },
    created() {
      const uri = '/handler';
      this.$http.get(uri)
        .then(resp => {
          this.handlers = resp.data;
        }).catch(error => {
        this.$bus.$emit('error', 'http request: ' + uri, error.message)
      });
    },
    methods: {
      uploadFile: function (e, type) {
        if (type === 'collection') {
          this.form['collection'] = e.target.files[0];
          return
        }
        if (e.target.files[0]) {
          this.form[type] = e.target.files[0];
        } else {
          delete this.form[type];
        }
      },
      submit: function () {
        let formData = new FormData();
        for (let key in this.form) {
          formData.append(key, this.form[key])
        }
        const uri = '/collection';
        this.$http.post(uri, formData)
          .then(() => {
            this.$router.push('/');
          }).catch(error => {
            this.$bus.$emit('error', 'http request: ' + uri + error.message, error.response.data)
        });
      }
    }
  }
</script>
