<template>
  <transition name="AlertTransition" appear>
    <aside class="Alert">
      <div class="Alert-overlay" @click="close"></div>
      <div class="Alert-panel">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        <button @click="close">{{ buttonLabel }}</button>
      </div>
    </aside>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    title: { type: String, required: true },
    message: { type: String, required: true },
    buttonLabel: { type: String, required: true },
  },
  created() {
    document.addEventListener("keydown", this.onKeyDown);
  },

  beforeUnmount() {
    document.removeEventListener("keydown", this.onKeyDown);
  },

  methods: {
    onKeyDown(e: KeyboardEvent) {
      if (e.keyCode === 27) {
        this.close();
      }
    },
    close() {
      this.$emit("close");
    },
  },
});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
