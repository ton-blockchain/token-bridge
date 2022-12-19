<template>
  <div class="Bridge">
    <Header
      :is-testnet="isTestnet"
      :show-menu="isConnected && walletsPopupState === 'closed'"
      :provider="provider"
      :is-history-shown="history.isShown"
      :disable-disconnect="isTransferInProgress"
    >
    </Header>

    <div class="Bridge-content" :style="contentStyle">
      <div></div>
      <main>
        <div class="Bridge-img" :class="{ isFromTon }">
          <div class="Bridge-imgAspect"></div>
        </div>
        <div class="Bridge-form">
          <div class="Bridge-switchers" :class="{ isFromTon }">
            <div class="Bridge-switcher" :class="{ disabled: isPairsBlocked }">
              <div class="Bridge-switcherTitle">
                <span
                  >{{ $t(`networks.ton.${netTypeName}.nameSwitcher`) }}<em></em
                ></span>
                <ul
                  class="Bridge-switcherList"
                  :class="{ left: isFromTon, right: !isFromTon }"
                >
                  <li v-for="(item, index) in fromPairs" :key="item">
                    <button
                      :disabled="index === 0"
                      @click="onPairClick(true, item)"
                    >
                      {{ $t(`networks.${item}.${netTypeName}.name`) }}
                    </button>
                  </li>
                </ul>
              </div>
              <div v-if="token === 'ton'" class="Bridge-switcherAnno">
                {{ $t(`networks.ton.${netTypeName}.coin`) }}
              </div>
            </div>

            <button
              class="Bridge-switcher-arrow"
              :disabled="isPairsBlocked"
              @click="toggleFromTon"
            ></button>

            <div class="Bridge-switcher" :class="{ disabled: isPairsBlocked }">
              <div class="Bridge-switcherTitle">
                <span
                  >{{ $t(`networks.${pair}.${netTypeName}.nameSwitcher`)
                  }}<em></em
                ></span>
                <ul
                  class="Bridge-switcherList"
                  :class="{ left: !isFromTon, right: isFromTon }"
                >
                  <li v-for="(item, index) in toPairs" :key="item">
                    <button
                      :disabled="index === 0"
                      @click="
                        onPairClick(
                          item === 'ton',
                          item === 'ton' ? pair : item
                        )
                      "
                    >
                      {{ $t(`networks.${item}.${netTypeName}.name`) }}
                    </button>
                  </li>
                </ul>
              </div>
              <div v-if="token === 'ton'" class="Bridge-switcherAnno">
                <a :href="pairNetworkCoinUrl" target="_blank">{{
                  $t(`networks.${pair}.${netTypeName}.coin`)
                }}</a>
              </div>
            </div>
          </div>

          <CustomInput
            key="token"
            :disabled="isInputsBlocked || !this.isTestnet"
            :label="$t('sendToken')"
            type="text"
            :dropdown="[
              { label: 'Toncoin', value: 'ton' },
              { label: 'Other tokens', value: 'otherTokens' },
            ]"
            v-model="token"
          ></CustomInput>
          <CustomInput
            v-if="token !== 'ton'"
            key="tokenAddress"
            :disabled="isInputsBlocked"
            :label="$t('tokenAddress')"
            type="text"
            :error="errors.tokenAddress"
            @changed="errors.tokenAddress = ''"
            @blur="checkInputs"
            v-model="tokenAddress"
          ></CustomInput>
          <CustomInput
            key="amountInput"
            :disabled="isInputsBlocked"
            :label="
              $t('amountOfTon', {
                tokenSymbol,
              })
            "
            type="number"
            :error="errors.amount"
            @changed="errors.amount = ''"
            @blur="checkInputs"
            v-model="amountInput"
          ></CustomInput>

          <CustomInput
            key="toAddress"
            :disabled="isInputsBlocked"
            :label="$t(`addressInputLabel`)"
            type="text"
            :error="errors.toAddress"
            @changed="errors.toAddress = ''"
            @blur="checkInputs"
            v-model="toAddress"
          ></CustomInput>

          <div
            class="Bridge-willReceive"
            v-show="
              (!isTransferInProgress ||
                !isConnected ||
                bridgeProcessorIsLoading) &&
              willReceive
            "
            :class="{ isFromTon }"
          >
            {{ willReceive }}
          </div>

          <div class="Bridge-bridgeWrapper">
            <button
              v-if="!isConnected"
              class="Bridge-connect"
              @click="walletsPopupState = 'opened'"
            >
              {{ $t("connectWallet") }}
            </button>

            <div
              class="Bridge-bridgeLoader"
              v-if="isConnected && bridgeProcessorIsLoading"
            ></div>

            <BridgeProcessor
              v-if="isConnected"
              ref="bridgeProcessor"
              :key="pair"
              :is-testnet="isTestnet"
              :is-recover="isRecover"
              :lt="lt"
              :hash="hash"
              :is-from-ton="isFromTon"
              :pair="pair"
              :tokenAddress="tokenAddress"
              :amount="amount"
              :to-address="toAddress"
              :tokenSymbol="tokenSymbol"
              :provider="provider"
              :token="token"
              :is-inputs-valid="isInputsValid"
              @transfer-in-progress="onTransferInProgress"
              @state-changed="getPairGasFee__debounced"
              @reset-state="resetState"
              @save-state="saveState"
              @delete-state="deleteState"
              @ready="onBridgeProcessorReady"
              @error="onBridgeTransferError"
            ></BridgeProcessor>
          </div>

          <div
            class="Bridge-pairFee"
            v-show="
              !isTransferInProgress || !isConnected || bridgeProcessorIsLoading
            "
          >
            {{ pairFee }}
          </div>
          <div
            class="Bridge-bridgeFee"
            v-show="
              !isTransferInProgress || !isConnected || bridgeProcessorIsLoading
            "
          >
            {{ bridgeFee }}
          </div>
        </div>
      </main>

      <Footer></Footer>
    </div>

    <WalletsPopup
      v-if="walletsPopupState !== 'closed'"
      :params="params"
      :uncancellable="walletsPopupState === 'opened-uncancellable'"
      @wallet-connected="onWalletConnected"
      @cancel="walletsPopupState = 'closed'"
    >
    </WalletsPopup>

    <!-- <History
      v-if="history.isShown"
      :provider="provider"
      :is-testnet="isTestnet"
      :token="token"
      :network="history.network"
      :address="history.address"
      @open-wallets-popup="walletsPopupState = 'opened'"
    >
    </History> -->
  </div>
</template>

<script lang="ts">
import BN from "bn.js";
import lodashDebounce from "lodash.debounce";
import debounce from "lodash.debounce";
import TonWeb from "tonweb";
import { defineComponent, markRaw, StyleValue } from "vue";
import Web3 from "web3";

import { getWrappedTokenData } from "@/ton-bridge-lib/BridgeJettonUtils";
import BridgeProcessor from "@/components/BridgeProcessor/index.vue";
import CustomInput from "@/components/CustomInput/index.vue";
import Footer from "@/components/Footer/index.vue";
import Header from "@/components/Header/index.vue";
// import History from "@/components/History/index.vue";
import WalletsPopup from "@/components/WalletsPopup/index.vue";
import { PARAMS } from "@/utils/constants";
import { supportsLocalStorage } from "@/utils/helpers";
import { Provider } from "@/utils/providers/provider";
import { ERC20Contract } from "@/utils/services/ERC20.contract";

import { ComponentData } from "./types";

const PAIRS = ["eth", "bsc"];
const fromNano = TonWeb.utils.fromNano;
const toNano = TonWeb.utils.toNano;

export default defineComponent({
  name: "Bridge",

  components: {
    BridgeProcessor,
    WalletsPopup,
    CustomInput,
    Header,
    Footer,
    // History,
  },

  head(): object {
    return {
      title: this.$t(`networks.${this.pair}.pageTitle`),
    };
  },

  data(): ComponentData {
    return {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      getPairGasFee__debounced: () => {},
      gasPrice: 0,

      isTestnet: false,
      isRecover: false,
      lt: 0,
      hash: "",

      isFromTon: true,
      pair: "eth",
      token: "ton",
      amountInput: "",
      toAddress: "",
      tokenAddress: "",
      provider: null,

      tokenSymbol: "TON",

      isTransferInProgress: false,
      isConnected: false,
      walletsPopupState: "closed",
      bridgeProcessorIsLoading: false,
      history: {
        address: "",
        network: "",
        isShown: false,
      },
      mainPageFixedPosition: 0,
      errors: {
        amount: "",
        toAddress: "",
        tokenAddress: "",
      },
    };
  },

  computed: {
    isInputsValid(): boolean {
      return !this.errors.amount && !this.errors.toAddress;
    },
    netTypeName(): string {
      return this.isTestnet ? "test" : "main";
    },
    params(): ParamsNetwork {
      const pairParams = PARAMS.networks[this.pair];
      return pairParams[this.netTypeName as keyof typeof pairParams];
    },
    pairNetworkCoinUrl(): string {
      const url = this.params.explorerUrl;
      const address = this.params.wTonAddress;
      return url.replace("<ADDRESS>", address);
    },
    willReceive(): string {
      if (this.bridgeFeeAmount.isZero()) {
        return "";
      } else {
        const coin = this.$t(
          `networks.${this.isFromTon ? this.pair : "ton"}.${
            this.netTypeName
          }.coin`
        );
        return this.$t("willReceive", {
          coin,
          fee: fromNano(this.amount.sub(this.bridgeFeeAmount)),
        });
      }
    },
    pairFee(): string {
      const n = this.gasPrice ? this.gasPrice / this.params.defaultGwei : 1;
      const fee = this.isFromTon
        ? this.params.coinsPerGweiTo * n
        : this.params.coinsPerGweiFrom * n;

      return this.$t(`networks.${this.pair}.gasFee`, {
        fee: fee.toFixed(4),
      });
    },
    amount(): BN {
      try {
        if (this.token === "ton") {
          return toNano(this.amountInput.toString());
        } else {
          return new BN(this.amountInput.toString());
        }
      } catch (e) {
        return new BN(0);
      }
    },
    bridgeFeeAmount(): BN {
      if (this.amount.lt(toNano("10"))) {
        return new BN(0);
      } else {
        const fixedFeeNano = toNano("5");
        const floatFeeNano = this.amount.sub(fixedFeeNano);
        //10000 is multiplier to get integer value for 0.2500%
        //100 is divider to convert percentages to fraction
        return floatFeeNano
          .muln(0.25 * 10000)
          .divn(10000 * 100)
          .add(fixedFeeNano); //5 + (this.amount - 5) * (0.25 / 100)
      }
    },
    bridgeFee(): string {
      if (this.bridgeFeeAmount.isZero()) {
        return this.$t("bridgeFeeBelow10");
      } else {
        return this.$t("bridgeFeeAbove10", {
          fee: fromNano(this.bridgeFeeAmount),
        });
      }
    },
    fromPairs(): string[] {
      return ["ton", ...PAIRS];
    },
    toPairs(): string[] {
      return [this.pair, ...PAIRS.filter((i) => i !== this.pair), "ton"];
    },
    isPairsBlocked(): boolean {
      return this.isTransferInProgress /* || this.isConnected*/;
    },
    isInputsBlocked(): boolean {
      return this.isTransferInProgress || !this.provider;
    },
    contentStyle(): StyleValue {
      if (this.history.isShown) {
        return {
          position: "fixed",
          top: -this.mainPageFixedPosition + "px",
        };
      } else {
        return {};
      }
    },
  },

  watch: {
    "$route.query": {
      immediate: true,
      handler(newVal: any) {
        if (newVal.historyAddress && newVal.historyNetwork) {
          this.history.isShown = true;
          this.history.address = newVal.historyAddress;
          this.history.network = newVal.historyNetwork;
        } else {
          this.history.isShown = false;
        }
      },
    },
    "history.isShown"(newVal: boolean) {
      if (newVal) {
        this.mainPageFixedPosition = window.pageYOffset;
      } else {
        this.mainPageFixedPosition = 0;
      }
    },
    isFromTon(newVal: boolean, oldVal: boolean) {
      this.getPairGasFee__debounced();

      if (newVal !== oldVal) {
        this.checkInputs();
      }
    },
    async pair(newVal: string, oldVal: string): Promise<void> {
      this.getPairGasFee__debounced();

      if (newVal !== oldVal) {
        this.checkInputs();
      }

      if (newVal !== oldVal && this.isConnected && this.provider) {
        const isChanged = await this.provider.switchChain(this.params.chainId);
        if (!isChanged) {
          this.pair = oldVal;
        }
      }
    },
  },

  created() {
    this.getPairGasFee__debounced = lodashDebounce(this.getPairGasFee, 100);

    if (this.$route.query.testnet) {
      this.isTestnet =
        this.$route.query.testnet.toString().toLowerCase() === "true";
    }
    if (this.$route.query.recover || this.$route.query.recovery) {
      const isRecover =
        (this.$route.query.recover?.toString() || "").toLowerCase() === "true";
      const isRecovery =
        (this.$route.query.recovery?.toString() || "").toLowerCase() === "true";
      this.isRecover = isRecover || isRecovery;
    }
    if (this.$route.query.lt) {
      const lt = parseInt(this.$route.query.lt.toString(), 10);
      this.lt = !lt || isNaN(lt) ? 0 : lt;
    }
    if (this.$route.query.hash) {
      this.hash = this.$route.query.hash.toString();
    }
    if (this.$route.query.amount) {
      try {
        this.amountInput = fromNano(this.$route.query.amount.toString());
      } catch (e) {
        this.amountInput = ""; // for empty string inside input
      }
    }
    if (this.$route.query.toAddress) {
      this.toAddress = this.$route.query.toAddress.toString();
    }
    if (this.$route.query.fromNetwork && this.$route.query.toNetwork) {
      const fromNetwork = this.$route.query.fromNetwork
        .toString()
        .toLowerCase();
      const toNetwork = this.$route.query.toNetwork.toString().toLowerCase();

      if (fromNetwork === "ton" && PAIRS.includes(toNetwork)) {
        this.isFromTon = true;
        this.pair = toNetwork;
      }

      if (toNetwork === "ton" && PAIRS.includes(fromNetwork)) {
        this.isFromTon = false;
        this.pair = fromNetwork;
      }
    }
  },

  mounted() {
    this.getPairGasFee__debounced();
    this.loadStateBridge();
    this.checkInputs();

    this.$watch(
      () => [this.tokenAddress, this.token, this.isFromTon],
      debounce(async ([newTokenAddress, newToken]: any) => {
        if (newToken === "ton") {
          this.tokenSymbol = "TON";
        } else {
          this.tokenSymbol = "";
          if (this.isFromTon) {
            if (
              newTokenAddress &&
              TonWeb.utils.Address.isValid(newTokenAddress)
            ) {
              try {
                const wrappedTokenData = await getWrappedTokenData(
                  new TonWeb(new TonWeb.HttpProvider(this.params.tonCenterUrl, {
                    apiKey: this.params.tonCenterApiKey
                  })),
                  this.tokenAddress
                );
                // if (wrappedTokenData.symbol) {
                //   this.tokenSymbol = wrappedTokenData.symbol;
                // }
              } catch (error) {
                console.error(error);
                this.tokenSymbol = "";
              }
            }
          } else {
            if (
              newTokenAddress &&
              Web3.utils.isAddress(newTokenAddress) &&
              this.provider
            ) {
              try {
                const erc20Contract = new ERC20Contract(this.provider as any);
                const symbol = await erc20Contract.symbol(newTokenAddress);
                this.tokenSymbol = symbol;
              } catch (error) {
                this.tokenSymbol = "";
              }
            } else {
              this.tokenSymbol = "";
            }
          }
        }
      }, 300)
    );
  },

  methods: {
    checkInputs() {
      this.errors.amount = "";
      this.errors.toAddress = "";
      this.errors.tokenAddress = "";

      if (this.isFromTon) {
        if (!Web3.utils.isAddress(this.toAddress)) {
          this.errors.toAddress = this.$t(
            `networks.${this.pair}.errors.invalidAddress`
          );
        }
      } else {
        if (!TonWeb.utils.Address.isValid(this.toAddress)) {
          this.errors.toAddress = this.$t(`networks.ton.errors.invalidAddress`);
        }
      }
      if (this.isFromTon) {
        if (!TonWeb.utils.Address.isValid(this.tokenAddress)) {
          this.errors.tokenAddress = this.$t(
            `networks.ton.errors.invalidAddress`
          );
        }
      } else {
        if (!Web3.utils.isAddress(this.tokenAddress)) {
          this.errors.tokenAddress = this.$t(
            `networks.${this.pair}.errors.invalidAddress`
          );
        }
      }
      if (this.token === "ton") {
        if (this.amount.lt(toNano("10"))) {
          this.errors.amount = this.$t("errors.amountBelow10");
        }
        try {
          toNano(this.amountInput.toString());
        } catch (e) {
          this.errors.amount = this.$t("errors.notValidAmount");
        }
        if (
          this.toAddress.toLowerCase() ===
            this.params.wTonAddress.toLowerCase() ||
          this.toAddress.toLowerCase() ===
            this.params.tonBridgeAddress.toLowerCase()
        ) {
          this.errors.toAddress = this.$t("errors.needPersonalAddress");
        }
      } else {
        //
      }
    },
    onPairClick(switchDirection: boolean, toPair: string) {
      if (this.isPairsBlocked) {
        return;
      }

      if (switchDirection) {
        this.isFromTon = !this.isFromTon;
      }
      this.pair = toPair;
    },
    resetState() {
      this.isRecover = false;
      this.lt = 0;
      this.hash = "";
      this.tokenAddress = "";
      this.amountInput = ""; //to reset inside input directly
      this.toAddress = "";
    },
    loadStateBridge() {
      if (!supportsLocalStorage()) {
        return;
      }

      const raw = localStorage.getItem("bridgeState");

      if (raw) {
        let state: any;
        try {
          state = JSON.parse(raw);
        } catch (e) {
          return;
        }

        this.amountInput = state.amount;
        this.toAddress = state.toAddress;
        this.tokenAddress = state.tokenAddress;
        this.pair = state.pair;
        this.isFromTon = (state.processingState as any).isFromTon;

        this.isTransferInProgress = true;
      }
    },
    loadStateProcessor() {
      if (!supportsLocalStorage()) {
        return;
      }

      const raw = localStorage.getItem("bridgeState");

      if (raw) {
        let state: any;
        try {
          state = JSON.parse(raw);
        } catch (e) {
          return;
        }

        this.token = (state.processingState as any).token;
        this.tokenAddress = (state.processingState as any).tokenAddress;
        console.log("loadState");
        // TODO vuex
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.$refs.bridgeProcessor.loadState(state);
      }
    },
    saveState(processingState: any) {
      if (!supportsLocalStorage()) {
        return;
      }

      const state = {
        amount: this.amountInput,
        toAddress: this.toAddress,
        pair: this.pair,
        processingState: processingState,
      };

      localStorage.setItem("bridgeState", JSON.stringify(state));
    },
    deleteState() {
      if (!supportsLocalStorage()) {
        return;
      }

      localStorage.removeItem("bridgeState");
    },
    onTransferInProgress(isActive: boolean) {
      this.isTransferInProgress = isActive;
      this.checkInputs();
    },
    toggleFromTon() {
      if (this.isPairsBlocked) {
        return;
      }
      this.isFromTon = !this.isFromTon;
    },
    async getPairGasFee(): Promise<void> {
      let data;
      let gasPrice = 0;

      try {
        const response = await fetch(this.params.getGasUrl, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`An error has occured: ${response.status}`);
        }

        data = await response.json();
      } catch (e) {
        this.gasPrice = 0;
        return;
      }

      if (this.pair === "eth") {
        gasPrice = parseFloat(data.average) / 10;
      }

      if (this.pair === "bsc") {
        gasPrice = parseFloat(data.result.SafeGasPrice);
      }

      this.gasPrice = gasPrice > 0 ? gasPrice : this.params.defaultGwei;
    },
    onWalletConnected(provider: Provider) {
      this.provider = markRaw(provider) as any;
      // TODO vuex
      this.bridgeProcessorIsLoading = !this.$refs.bridgeProcessor;
      this.isConnected = true;
      this.walletsPopupState = "closed";
      (this.$refs?.bridgeProcessor as any)?.onTokenChange(this.token);

      this.provider!.on("disconnect", () => {
        if (this.isTransferInProgress) {
          this.walletsPopupState = "opened-uncancellable";
        } else {
          this.provider = null;
          this.isConnected = false;
          this.bridgeProcessorIsLoading = false;
        }
      });
    },
    onBridgeProcessorReady() {
      this.loadStateProcessor();
      this.bridgeProcessorIsLoading = false;
    },
    onBridgeTransferError(params: { input: string; message: string }) {
      if (params.input === "amount") {
        this.errors.amount = params.message;
      }
      if (params.input === "toAddress") {
        this.errors.toAddress = params.message;
      }
    },
  },
});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
