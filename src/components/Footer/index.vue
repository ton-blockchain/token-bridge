<template>
  <footer class="Footer">
    <!-- Version -->
    v3.0.19,

    <!-- Instruction -->
    <a :href="instructionLink" target="_blank">{{$t(`instruction`)}}</a>,

    <!-- Support -->
    <a href="https://t.me/ton_help_bot" target="_blank">{{$t("support")}}</a>
    .

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

export default defineComponent({
  name: "Footer",
  computed: {
    instructionLink(): string {
      return this.$t(`instruction`) === 'Инструкция' ? 'https://tonblockchain.ru/chto-takoie-mosty-v-blokchieinie-i-kak-oni-rabotaiut/' : 'https://blog.ton.org/ton-erc-20-bridge-tutorial'
    }
  }
});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
