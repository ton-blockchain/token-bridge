<template>
  <header class="Header" :class="{ isScrolled }">
    <div class="Header-testnet" v-if="isTestnet">
      {{ $t(`testnetMessage`) }}
    </div>
    <div class="Header-wrapper">
      <component
        :is="isHistoryShown ? 'NuxtLink' : 'div'"
        :to="parentUrl"
        class="Header-logo"
        :class="{ isHistoryShown }"
      >
        <span class="Header-logoIcon"></span>
        <span class="Header-logoLabel">{{ $t(`logoLabel`) }}</span>
      </component>
      <div class="Header-menu">
        <template v-if="showMenu">
          <!-- <router-link
            :to="historyUrl"
            class="Header-menuHistory"
            v-if="historyUrl && !isHistoryShown"
            >{{ $t(`transferHistory`) }}</router-link
          > -->
          <div class="Header-menuWrapper">
            <div class="Header-menuAddress" :data-icon="provider?.name">
              <span>{{ address }}</span>
            </div>
            <ul class="Header-menuList">
              <li data-id="address">
                <span>{{ address }}</span>
              </li>
              <!-- <li data-id="history">
                <router-link
                  :to="historyUrl"
                  v-if="historyUrl && !isHistoryShown"
                  >{{ $t(`transferHistory`) }}</router-link
                >
              </li> -->
              <li data-id="disconnect">
                <button
                  @click="onDisconnectClick"
                  :disabled="disableDisconnect"
                >
                  {{ $t(`disconnectWallet`) }}
                </button>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

import { PARAMS } from "@/utils/constants";
import { Provider } from "@/utils/providers/provider";

type ComponentData = {
  isScrolled: boolean;
};

export default defineComponent({
  name: "Header",
  props: {
    isTestnet: {
      type: Boolean,
      default: false,
    },
    showMenu: {
      type: Boolean,
      required: true,
    },
    provider: {
      type: Object as PropType<Provider | null>,
      required: true,
    },
    disableDisconnect: {
      type: Boolean,
      default: false,
    },
    isHistoryShown: {
      type: Boolean,
      default: false,
    },
  },

  data(): ComponentData {
    return {
      isScrolled: window.pageYOffset > 0,
    };
  },

  computed: {
    address(): string {
      if (!this.provider) {
        return "";
      }
      return (
        this.provider.myAddress.slice(0, 6) +
        "…" +
        this.provider.myAddress.slice(-4)
      );
    },
    parentUrl(): string {
      const { historyAddress, historyNetwork, ...query } = this.$route.query;
      return this.generateUrlWithQuery(query);
    },
    historyUrl(): string {
      if (!this.provider || !this.provider.myAddress) {
        return "";
      }

      let network = "";
      Object.keys(PARAMS.networks).forEach((netKey: string) => {
        const net = PARAMS.networks[netKey as keyof typeof PARAMS.networks];
        Object.keys(net).forEach((subnetKey: string) => {
          const subnet = net[subnetKey as keyof typeof net];
          if (subnet.chainId === this.provider?.chainId) {
            network = netKey;
          }
        });
      });

      const query = {
        ...this.$route.query,
        historyAddress: this.provider.myAddress,
        historyNetwork: network,
      };
      return this.generateUrlWithQuery(query);
    },
  },

  created() {
    window.addEventListener("scroll", this.onScroll);
  },

  beforeDestroy() {
    window.removeEventListener("scroll", this.onScroll);
  },

  methods: {
    generateUrlWithQuery(query: any): string {
      const urlVars: string[] = Object.keys(query).map((key: string) => {
        return key + "=" + encodeURIComponent(query[key]);
      });
      return this.$router
        .resolve("/" + (urlVars ? "?" + urlVars.join("&") : ""))
        .href.replace("bridge", ""); // TODO in nuxt this.localePath
    },
    onScroll() {
      this.isScrolled = window.pageYOffset > 0;
    },
    close() {
      this.$emit("close");
    },
    onDisconnectClick() {
      this.provider?.disconnect();
    },
  },
});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
