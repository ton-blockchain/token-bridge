<template>
  <div class="LayoutDefault">
    <slot></slot>
    <Alert
      v-if="alert"
      :title="alert.title"
      :message="alert.message"
      :buttonLabel="alert.buttonLabel"
      @close="setAlert(null)"
    ></Alert>
  </div>
</template>

<script lang="ts">
import { primaryInput } from "detect-it";
import { defineComponent } from "vue";
import { mapGetters, mapMutations } from "vuex";

import Alert from "@/components/Alert/index.vue";

export default defineComponent({
  name: "LayoutDefault",

  components: { Alert },
  methods: { ...mapMutations(["setAlert"]) },

  computed: {
    ...mapGetters(["alert"]),
  },

  mounted() {
    // for active/hovers on touch/mouse devices
    document.documentElement.classList.add(
      primaryInput === "touch" ? "isTouch" : "isPointer"
    );
  },

  watch: {
    alert: function (newVal) {
      if (newVal !== null) {
        this.alert = { ...newVal };
      }
    },
  },
});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
