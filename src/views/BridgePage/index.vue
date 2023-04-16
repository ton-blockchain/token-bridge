<template>
  <div class="Bridge">

    <!-- Header -->

    <Header
        :is-testnet="isTestnet"
        :show-menu="isEthereumWalletConnected && walletsPopupState === 'closed'"
        :ethereumProvider="ethereumProvider"
        :disable-disconnect="isTransferInProgress"
    >
    </Header>

    <div class="Bridge-mobile-label">
      Please use desktop
    </div>

    <div class="Bridge-content">
      <div></div>
      <main>

        <!-- Image -->

        <div class="Bridge-img" :class="{ isFromTon }">
          <div class="Bridge-imgAspect"></div>
        </div>

        <!-- Network Switcher Left -->

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

            <!-- Network Switcher Arrow -->

            <button
                class="Bridge-switcher-arrow"
                :disabled="isPairsBlocked"
                @click="toggleFromTon"
            ></button>

            <!-- Network Switcher Right -->

            <div class="Bridge-switcher" :class="{ disabled: isPairsBlocked }">
              <div class="Bridge-switcherTitle">
                <span
                >{{
                    $t(`networks.${pair}.${netTypeName}.nameSwitcher`)
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

          <!-- Toncoin/Other Tokens selector -->

          <CustomInput
              key="token"
              :disabled="isInputsBlocked || this.pair === 'bsc'"
              :label="$t('sendToken')"
              type="text"
              :dropdown="[
              { label: 'Toncoin', value: 'ton' },
              { label: 'USDT', value: 'usdt' },
              { label: 'USDC', value: 'usdc' },
              { label: 'DAI', value: 'dai' },
              { label: 'WBTC', value: 'wbtc' },
            ]"
              v-model="token"
          ></CustomInput>

          <!-- Token Address input -->

          <CustomInput
              v-if="token === 'otherTokens'"
              key="tokenAddress"
              :disabled="isInputsBlocked"
              :label="$t('tokenAddress', {network: isFromTon ? 'TON' : pair.toUpperCase()})"
              type="text"
              :error="errors.tokenAddress"
              @changed="errors.tokenAddress = ''"
              @blur="checkInputs"
              v-model="tokenAddress"
          ></CustomInput>

          <!-- Amount input -->

          <CustomInput
              key="amountInput"
              :disabled="isInputsBlocked"
              :label="$t('amountOfTon', {tokenSymbol})"
              type="text"
              :error="errors.amount"
              @changed="errors.amount = ''"
              @blur="checkInputs"
              v-model="amountInput"
          ></CustomInput>

          <!-- To Address input -->

          <CustomInput
              key="toAddress"
              :disabled="isInputsBlocked"
              :label="$t(`addressInputLabel`, {network: isFromTon ? pair.toUpperCase() : 'TON'})"
              type="text"
              :error="errors.toAddress"
              @changed="errors.toAddress = ''"
              @blur="checkInputs"
              v-model="toAddress"
          ></CustomInput>

          <!-- "You will receive {fee} {coin}" -->

          <div
              class="Bridge-willReceive"
              v-show="!isTransferInProgress && willReceive"
              :class="{ isFromTon }"
          >
            {{ willReceive }}
          </div>

          <div class="Bridge-bridgeWrapper">

            <!-- Connect wallet button -->

            <button
                v-if="!isEthereumWalletConnected"
                class="Bridge-connect"
                @click="walletsPopupState = 'opened'"
            >
              {{ $t("connectWallet") }}
            </button>

            <!-- Loading -->

            <div
                class="Bridge-bridgeLoader"
                v-if="isEthereumWalletConnected && bridgeProcessorIsLoading"
            ></div>

            <!-- BridgeProcessor -->

            <BridgeProcessor
                v-if="isEthereumWalletConnected"
                ref="bridgeProcessor"
                :key="pair"
                :is-testnet="isTestnet"
                :is-recover="isRecover"
                :lt="lt"
                :hash="hash"
                :is-from-ton="isFromTon"
                :pair="pair"
                :tokenAddress="getTokenAddress"
                :amount="amountInput.trim()"
                :to-address="toAddress"
                :tokenSymbol="tokenSymbol"
                :ethereumProvider="ethereumProvider"
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

          <!-- "Ethereum gas fee ~ {fee} ETH" -->

          <div
              class="Bridge-pairFee"
              v-show="!isTransferInProgress"
          >
            {{ pairFee }}
          </div>

          <!-- "Bridge fee - 5 TON + 0.25% of amount" -->

          <div
              class="Bridge-bridgeFee"
              v-show="!isTransferInProgress"
          >
            {{ bridgeFee }}
          </div>
        </div>
      </main>

      <!-- Footer -->

      <Footer></Footer>
    </div>

    <!-- Connect Wallet Popup -->

    <WalletsPopup
        v-if="walletsPopupState !== 'closed'"
        :params="params"
        :uncancellable="walletsPopupState === 'opened-uncancellable'"
        @wallet-connected="onWalletConnected"
        @cancel="walletsPopupState = 'closed'"
    >
    </WalletsPopup>

  </div>
</template>

<script lang="ts">
import BN from "bn.js";
import lodashDebounce from "lodash.debounce";
import TonWeb from "tonweb";
import {defineComponent, markRaw} from "vue";
import Web3 from "web3";

import BridgeProcessor from "@/components/BridgeProcessor/index.vue";
import CustomInput from "@/components/CustomInput/index.vue";
import Footer from "@/components/Footer/index.vue";
import Header from "@/components/Header/index.vue";
import WalletsPopup from "@/components/WalletsPopup/index.vue";
import {getTokenAddressByToken, MINIMUM_TONCOIN_AMOUNT, PARAMS} from "@/utils/constants";
import {supportsLocalStorage} from "@/utils/helpers";
import {Provider} from "@/utils/providers/provider";

import {ComponentData} from "./types";
import {decToBN} from "@/ton-bridge-lib/Paranoid";

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
  },

  head(): object {
    return {
      title: this.$t(`networks.${this.pair}.pageTitle`),
    };
  },

  data(): ComponentData {
    return {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      getPairGasFee__debounced: () => {
      },
      gasPrice: 0,

      isTestnet: false, // immutable parameter from url
      isRecover: false, // immutable parameter from url
      lt: 0, // immutable parameter from url
      hash: "", // immutable parameter from url

      isFromTon: true, // transfer direction - to-ton-network or from-ton-network
      pair: "eth", // "eth" or "bsc"
      token: "ton", // "ton" | "usdt" | "usdc" | "dai" | "wbtc" | "otherTokens"
      amountInput: "", // float as string, "" if no value
      toAddress: "", // Ethereum or TON to address
      tokenAddress: "", // Ethereum or TON token address

      tokenSymbol: "TON",

      walletsPopupState: "closed",
      ethereumProvider: null, // Ethereum provider
      isEthereumWalletConnected: false, // ethereumProvider !== null
      bridgeProcessorIsLoading: false, // from connect wallet to BridgeProcessor creation
      isTransferInProgress: false,

      errors: {
        amount: "",
        toAddress: "",
        tokenAddress: "",
      },
    };
  },

  computed: {
    isToncoinTransfer(): boolean {
      return this.token === "ton";
    },
    isInputsValid(): boolean {
      return !this.errors.amount && !this.errors.toAddress && (this.isToncoinTransfer || !this.errors.tokenAddress);
    },
    getTokenAddress(): string {
      if (this.token === '') {
        return this.tokenAddress;
      } else {
        return getTokenAddressByToken(this.token, this.isFromTon, this.isTestnet, this.pair);
      }
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
      }

      if (this.isToncoinTransfer) {
        const coin = this.$t(
            `networks.${this.isFromTon ? this.pair : "ton"}.${
                this.netTypeName
            }.coin`
        );
        return this.$t("willReceive", {
          coin,
          fee: fromNano(toNano(this.amountInput).sub(this.bridgeFeeAmount)),
        });
      } else {
        return "";
      }
    },
    pairFee(): string {
      const n = this.gasPrice ? this.gasPrice / this.params.defaultGwei : 1;
      const toncoinFee = this.isFromTon
          ? this.params.toncoinTransferFrom_gasPrice * n
          : this.params.toncoinTransferTo_gasPrice * n;

      const tokenFee = this.isFromTon
          ? this.params.tokenTransferFrom_gasPrice * n
          : this.params.tokenTransferTo_gasPrice * n;

      const fee = this.isToncoinTransfer ? toncoinFee : tokenFee;

      return this.$t(`networks.${this.pair}.gasFee`, {
        fee: fee.toFixed(4),
      });
    },
    bridgeFeeAmount(): BN { // in nanoton

      if (this.isToncoinTransfer) {
        let amount = undefined;
        try {
          amount = toNano(this.amountInput);
        } catch (e) {
        }
        if (amount === undefined) {
          return new BN(0);
        }
        if (amount.lt(MINIMUM_TONCOIN_AMOUNT)) {
          return new BN(0);
        } else {
          const feeFlat = toNano('5');
          const feeFactor = decToBN('25');
          const feeBase = decToBN('10000');
          const rest = amount.sub(feeFlat);
          const percentFee = rest
              .mul(feeFactor)
              .div(feeBase);
          return feeFlat.add(percentFee);
        }
      } else { // token transfer - fixed 1 TON fee
        return toNano("1");
      }
    },
    bridgeFee(): string {
      if (this.token === 'ton') {
        if (this.bridgeFeeAmount.isZero()) {
          return this.$t("bridgeFeeBelow10");
        } else {
          return this.$t("bridgeFeeAbove10", {
            fee: fromNano(this.bridgeFeeAmount),
          });
        }
      } else {
        return this.$t("tokenBridgeFee")
      }
    },
    fromPairs(): string[] {
      return ["ton", ...PAIRS];
    },
    toPairs(): string[] {
      return [this.pair, ...PAIRS.filter((i) => i !== this.pair), "ton"];
    },
    isPairsBlocked(): boolean {
      return this.isTransferInProgress;
    },
    isInputsBlocked(): boolean {
      return this.isTransferInProgress;
    },
  },

  watch: {
    isFromTon(newVal: boolean, oldVal: boolean) {
      this.getPairGasFee__debounced();

      if (newVal !== oldVal) {
        this.checkInputs();
      }
    },
    async pair(newVal: string, oldVal: string): Promise<void> {
      if (newVal === 'bsc') {
        this.token = 'ton';
      }

      this.getPairGasFee__debounced();

      if (newVal !== oldVal) {
        this.checkInputs();
      }

      // if (newVal !== oldVal && this.isEthereumWalletConnected && this.ethereumProvider) {
      //   const isChanged = await this.ethereumProvider.switchChain(this.params.chainId);
      //   if (!isChanged) {
      //     this.pair = oldVal;
      //   }
      // }
    },
  },

  created() {
    this.getPairGasFee__debounced = lodashDebounce(this.getPairGasFee, 100);

    // Get params from url in case of recovery

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
        this.amountInput = this.$route.query.amount.toString();
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
    if (this.$route.query.token) {
      const t = this.$route.query.token.toString().toLowerCase();
      if (t === 'ton' || t === "usdt" || t === "usdc" || t === "dai" || t === "wbtc") {
        this.token = 'ton';
        this.tokenAddress = getTokenAddressByToken(this.token, this.isFromTon, this.isTestnet, this.pair);
      } else {
        this.token = 'otherTokens';
        this.tokenAddress = t;
      }
    }
  },

  mounted() {
    this.getPairGasFee__debounced();
    this.loadStateBridge();
    this.checkInputs();

    this.$watch(
        () => this.tokenAddress + "_" + this.token + "_" + this.isFromTon,
        () => {
          if (this.token === 'otherTokens') {
            this.tokenSymbol = "";
          } else {
            this.tokenSymbol = this.token.toUpperCase();
          }
        }
    );
  },

  methods: {
    checkInputs() {
      this.errors.tokenAddress = "";
      this.errors.amount = "";
      this.errors.toAddress = "";

      // check tokenAddress input

      const tokenAddress = this.getTokenAddress;
      if (this.isFromTon) {
        if (!TonWeb.utils.Address.isValid(tokenAddress)) {
          this.errors.tokenAddress = this.$t(
              `networks.ton.errors.invalidAddress`
          );
        }
      } else {
        if (!Web3.utils.isAddress(tokenAddress)) {
          this.errors.tokenAddress = this.$t(
              `networks.${this.pair}.errors.invalidAddress`
          );
        }

        if (tokenAddress.toLowerCase() === this.params.wTonAddress.toLowerCase()) {
          this.errors.tokenAddress = this.$t(
              `networks.${this.pair}.errors.invalidAddress`
          );
        }
      }

      // check amount input

      if (this.token === "ton") {
        let amount = undefined;
        try {
          amount = toNano(this.amountInput);
        } catch (e) {
          this.errors.amount = this.$t("errors.notValidAmount");
        }

        if (amount !== undefined && amount.lt(MINIMUM_TONCOIN_AMOUNT)) {
          this.errors.amount = this.$t("errors.amountBelow10");
        }
      } else {
        let amount = undefined;
        try {
          if (this.amountInput.trim().startsWith('0x')) throw new Error();
          amount = Number(this.amountInput);
          if (isNaN(amount)) throw new Error();
        } catch (e) {
          this.errors.amount = this.$t("errors.notValidAmount");
        }

        if (amount !== undefined && amount <= 0) {
          this.errors.amount = this.$t("errors.notValidAmount");
        }
      }

      // check toAddress input

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

      if (
          this.toAddress.toLowerCase() === this.params.wTonAddress.toLowerCase() ||
          this.toAddress.toLowerCase() === this.params.tonBridgeAddress.toLowerCase() ||
          this.toAddress.toLowerCase() === this.params.tonBridgeV2EVMAddress.toLowerCase() ||
          this.toAddress.toLowerCase() === this.params.tonBridgeAddressV2.toLowerCase() ||
          (this.tokenAddress && this.toAddress.toLowerCase() === this.tokenAddress.toLowerCase())
      ) {
        this.errors.toAddress = this.$t("errors.needPersonalAddress");
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
    toggleFromTon() {
      if (this.isPairsBlocked) {
        return;
      }
      this.isFromTon = !this.isFromTon;
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
        this.pair = state.pair;
        this.isFromTon = state.isFromTon;
        this.token = state.token;
        this.tokenAddress = state.tokenAddress;

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
        isFromTon: this.isFromTon,
        token: this.token,
        tokenAddress: this.tokenAddress,
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
    onWalletConnected(ethereumProvider: Provider) {
      this.ethereumProvider = markRaw(ethereumProvider) as any;
      // TODO vuex
      this.bridgeProcessorIsLoading = !this.$refs.bridgeProcessor;
      this.isEthereumWalletConnected = true;
      this.walletsPopupState = "closed";
      (this.$refs?.bridgeProcessor as any)?.onTokenChange(this.token);

      this.ethereumProvider!.on("disconnect", () => {
        if (this.isTransferInProgress) {
          this.walletsPopupState = "opened-uncancellable";
        } else {
          this.ethereumProvider = null;
          this.isEthereumWalletConnected = false;
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
