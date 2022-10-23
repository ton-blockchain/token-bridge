import { createStore } from "vuex";

export default createStore({
  state: () => ({ alert: null }),
  mutations: {
    setAlert(state, payload) {
      state.alert = payload;
    },
  },
  getters: {
    alert(state) {
      return state.alert;
    },
  },
  actions: {},
});
