import "@/assets/styles/reboot.css";
import "@/assets/styles/global.less";

import { createApp } from "vue";
import UUID from "vue-uuid";

import App from "./App.vue";
import i18n from "./i18n";
import router from "./router";
import store from "./store";

createApp(App).use(UUID).use(i18n).use(store).use(router).mount("#app");
