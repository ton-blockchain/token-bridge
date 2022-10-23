import { createRouter, createWebHistory } from "vue-router";

import BridgePageVue from "@/views/BridgePage/index.vue";

const routes = [
  {
    path: "/",
    name: "Bridge",
    component: BridgePageVue,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});
export default router;
