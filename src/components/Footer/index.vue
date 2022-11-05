<template>
  <footer class="Footer">
    v3.0.1,
    <a href="https://github.com/ton-blockchain/bridge" target="_blank">{{
        $t("sourceCode")
      }}</a
    >,
    <!--    <a href="https://ton.org/how-it-works/bridge" target="_blank">{{-->
    <!--      $t("howItWorks")-->
    <!--    }}</a-->
    <!--    >,-->
    <a
        href="https://github.com/ton-blockchain/TIPs/issues/24"
        target="_blank"
    >{{ $t("documentation") }}</a
    >.
  </footer>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
