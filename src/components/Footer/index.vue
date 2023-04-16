<template>
  <footer class="Footer">
    v3.0.9,
    <a href="https://t.me/ton_help_bot" target="_blank">{{
        $t("support")
      }}</a
    >.
    <!--    <a href="https://ton.org/how-it-works/bridge" target="_blank">{{-->
    <!--      $t("howItWorks")-->
    <!--    }}</a-->
    <!--    >,-->
<!--    <a-->
<!--        href="https://github.com/ton-blockchain/TIPs/issues/24"-->
<!--        target="_blank"-->
<!--    >{{ $t("documentation") }}</a-->
<!--    >-->
  </footer>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
