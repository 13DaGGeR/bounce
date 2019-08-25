import Vue from 'vue';
import mainComponent from './inc/main'

new Vue({
    el: '#app',
    render: function (cb) {
        return cb(mainComponent);
    }
});
