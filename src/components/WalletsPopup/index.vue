<template>
  <transition name="WalletsPopupTransition" appear>
    <aside class="WalletsPopup" :class="{ isLoading }">
      <div class="WalletsPopup-overlay" @click="close"></div>

      <div class="WalletsPopup-panel">
        <ul>
          <li
            v-for="item in providersList"
            :key="item"
            @click="onProviderClick(item)"
          >
            <button
              :data-icon="item"
              :disabled="isLoading"
              :class="{ showLoader: isLoading && loadingProviderName === item }"
            >
              {{ $t(`providers.${item}`) }}<em></em>
            </button>
          </li>
        </ul>
        <button
          class="WalletsPopup-panelClose"
          v-if="!uncancellable"
          @click="close"
        ></button>
      </div>
    </aside>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { Provider } from "@/utils/providers/provider";

const PROVIDERS = {
  metamask: "Metamask",
  // walletConnect: "WalletConnect",
  // walletLink: "WalletLink",
};

type ComponentData = {
  isLoading: boolean;
  loadingProviderName: string;
};

export default defineComponent({
  props: {
    params: {
      type: Object,
      required: true,
    },
    uncancellable: {
      type: Boolean,
      default: false,
    },
  },

  data(): ComponentData {
    return {
      isLoading: false,
      loadingProviderName: "",
    };
  },

  computed: {
    providersList(): string[] {
      return Object.keys(PROVIDERS);
    },
  },

  created() {
    document.addEventListener("keydown", this.onKeyDown);
  },

  beforeDestroy() {
    document.removeEventListener("keydown", this.onKeyDown);
  },

  methods: {
    onKeyDown(e: KeyboardEvent) {
      if (e.keyCode === 27) {
        this.close();
      }
    },
    close() {
      if (this.uncancellable) return;
      if (this.isLoading) return;
      this.$emit("cancel");
    },
    async onProviderClick(providerName: string): Promise<void> {
      if (this.isLoading) return;

      this.isLoading = true;
      this.loadingProviderName = providerName;

      const providerComponentName: string =
        PROVIDERS[providerName as keyof typeof PROVIDERS];
      const ProviderComponent = await import(
        `@/utils/providers/${providerName}/index`
      );

      try {
        const provider = new ProviderComponent[
          providerComponentName
        ]() as Provider;

        const result = await provider.connect({
          rpcEndpoint: this.params.rpcEndpoint,
          chainId: this.params.chainId,
        });

        this.isLoading = false;

        if (!result) {
          return;
        }

        this.$emit("wallet-connected", provider);
      } catch (e: any) {
        const message = this.$te(e.message) ? this.$t(e.message) : e.message;
        console.error(message);
        alert(message);
        this.isLoading = false;
      }
    },
  },
});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
