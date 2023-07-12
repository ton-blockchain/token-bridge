<template>
  <div class="LayoutDefault">
    <slot></slot>
    <AlertIndex
      v-if="alert"
      :title="alert.title"
      :message="alert.message"
      :buttonLabel="alert.buttonLabel"
      :link="alert.link"
      :linkText="alert.linkText"
      @close="setAlert(null)"
    ></AlertIndex>
  </div>
</template>

<script setup lang="ts">
import { primaryInput } from "detect-it";
import { computed, watch, onMounted} from "vue";
import { useStore } from "vuex";
import AlertIndex from "@/components/Alert/AlertIndex.vue";

onMounted(()=>{
  document.documentElement.classList.add(
      primaryInput === "touch" ? "isTouch" : "isPointer"
  );
})

const store = useStore()
const alert = computed(()=>store.getters.alert)

const setAlert = (alert: string | null)=>{
  store.commit('setAlert',alert )
}

watch(alert, (newVal)=>{
  if (newVal !== null) {
    setAlert({ ...newVal })
  }
})
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
