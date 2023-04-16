<template>
  <div class="BridgeProcessor">
    <!-- Transfer Button -->

    <button
        class="BridgeProcessor-transfer"
        :disabled="!isInputsValid"
        :class="{
        showLoader:
          isInitInProgress || isBurningInProgress || isLockingInProgress,
      }"
        v-if="state.step === 0 && (isFromTon || hasApprove || token === 'ton')"
        @click="onTransferClick"
    >
      {{ $t("transfer") }}
    </button>

    <!-- Approve ERC-20 Button -->

    <button
        class="BridgeProcessor-transfer"
        :disabled="!isInputsValid || isGetAllowanceError"
        :class="{ showLoader: isApprovingInProgress || isGetAllowanceInProcess }"
        v-if="state.step === 0 && !isFromTon && !hasApprove && token !== 'ton'"
        @click="onApproveClick"
    >
      Approve
    </button>

    <!-- Cancel Transfer Button -->

    <button
        v-if="isCancelButtonVisible"
        class="BridgeProcessor-cancel"
        @click="onCancelClick"
    >
      {{ $t("cancel") }}
    </button>

    <!-- Transfer Steps -->

    <div class="BridgeProcessor-infoWrapper" v-if="state.step > 0">

      <!-- Step 1 - Transfer Toncoin to bridge or Confirm action in wallet -->

      <div class="BridgeProcessor-infoLine">
        <div
            class="BridgeProcessor-info-icon"
            :class="{
            none: state.step < 1,
            pending: state.step === 1,
            done: state.step > 1,
          }"
        ></div>

        <!-- Toncoin transfer info and QR -->
        <div
            class="BridgeProcessor-info-text"
            v-if="!getStepInfoText1.isOnlyText"
        >
          <div class="BridgeProcessor-info-text-send">
            <div>
              {{ getStepInfoText1.send1 }}
              <button
                  class="BridgeProcessor-info-text-copy"
                  @click="onCopyClick"
              >
                {{ getStepInfoText1.amountReadable }}
              </button>
              {{ getStepInfoText1.send2 }}<br/>
              <button
                  class="BridgeProcessor-info-text-copy"
                  @click="onCopyClick"
              >
                {{ getStepInfoText1.toAddress }}
              </button
              >
              <br/>
              {{ getStepInfoText1.withComment }}<br/>
              <button
                  class="BridgeProcessor-info-text-copy"
                  @click="onCopyClick"
              >
                {{ getStepInfoText1.comment }}
              </button
              >
              <br/>
            </div>

            <div class="BridgeProcessor-info-text-send-buttons">
              <a
                  :href="getStepInfoText1.openWalletUrl"
                  class="BridgeProcessor-info-text-openWallet"
                  target="_blank"
              >{{ getStepInfoText1.openWalletLabel }}</a
              >

              <button
                  class="BridgeProcessor-info-text-generateQRCode"
                  v-if="!isQRCodeShown"
                  @click="generateQRCode"
              >
                {{ getStepInfoText1.generateQRCode }}
              </button>
              <div
                  class="BridgeProcessor-info-text-scanQRCode"
                  v-if="isQRCodeShown"
              >
                {{ getStepInfoText1.scanQRCode }}
              </div>

              <div
                  class="BridgeProcessor-info-text-QRCode"
                  ref="qrcode"
                  v-show="isQRCodeShown"
              ></div>
            </div>
          </div>
        </div>
        <div class="BridgeProcessor-info-text" v-else>
          {{ getStepInfoText1.text }}
        </div>
      </div>

      <!-- Step 2 - Block confirmations -->

      <div class="BridgeProcessor-infoLine" v-if="!isFromTon">
        <div
            class="BridgeProcessor-info-icon"
            :class="{
            none: state.step < 2,
            pending: state.step === 2,
            done: state.step > 2,
          }"
        ></div>
        <div class="BridgeProcessor-info-text">{{ getStepInfoText2 }}</div>
      </div>

      <!-- Step 3 - Pay jettons mint or Oracles confirmations -->

      <div class="BridgeProcessor-infoLine">
        <div
            class="BridgeProcessor-info-icon"
            :class="{
            none: state.step < 3,
            pending: state.step === 3,
            done: state.step > 3,
          }"
        ></div>
        <div class="BridgeProcessor-info-text">{{ getStepInfoText3 }}</div>
      </div>

      <!--  Step 4 - Get tokens or Oracles confirmation -->

      <div class="BridgeProcessor-infoLine">
        <div
            class="BridgeProcessor-info-icon"
            :class="{
            none: state.step < 4,
            pending: state.step === 4,
            done: state.step > 4,
          }"
        ></div>
        <div class="BridgeProcessor-info-text">{{ getStepInfoText4 }}</div>
      </div>

    </div>

    <!-- Get/Mint Toncoin Button -->

    <button
        v-if="isMintToncoinButtonVisible"
        class="BridgeProcessor-getTonCoin"
        :class="{ showLoader: isMintingInProgress }"
        @click="mint"
    >
      {{ $t("getToncoin", {coin: toCoin}) }}
    </button>

    <!-- Done Button -->

    <button
        v-if="isDoneButtonVisible"
        class="BridgeProcessor-done"
        @click="onDoneClick"
    >
      {{ $t("done") }}
    </button>
  </div>
</template>

<script lang="ts">
import {MaxInt256} from "@ethersproject/constants";
import {formatUnits, parseUnits} from "@ethersproject/units";
import BN from "bn.js";
import {debounce} from "lodash";
import QRCodeStyling, {Options} from "qr-code-styling";
import TonWeb from "tonweb";
import {defineComponent, PropType} from "vue";
import {mapMutations} from "vuex";
import Web3 from "web3";
import {AbiItem} from "web3-utils";

import BRIDGE from "@/ton-bridge-lib/abi/TokenBridge.json";
import WTON_BRIDGE from "@/ton-bridge-lib/abi/WTON.json";
import {
  getJettonMinterAddress,
  getJettonWalletAddress,
  getJettonWalletBalance,
  getWrappedTokenData,
} from "@/ton-bridge-lib/BridgeJettonUtils";
import {burnJetton, mintJetton} from "@/api/tonWallet";
import {onCopyClick} from "@/utils";
import {PARAMS} from "@/utils/constants";
import {
  EvmSignature,
  getEvmSignaturesFromCollector,
  parseEvmSignature,
  prepareEthSignatures
} from "@/ton-bridge-lib/BridgeCollector";
import {getQueryId} from "@/ton-bridge-lib/BridgeCommon";
import {Provider} from "@/utils/providers/provider";
import {ERC20Contract} from "@/utils/services/ERC20.contract";

import {ComponentData, ProviderDataForJettons, ProviderDataForToncoin,} from "./types";
import {SwapTonToEth, ToncoinBridge} from "@/ton-bridge-lib/ToncoinBridge";
import {BurnEvent, TokenBridge} from "@/ton-bridge-lib/TokenBridge";
import {makeAddress} from "@/ton-bridge-lib/BridgeTonUtils";
import {getVotesInMultisig} from "@/ton-bridge-lib/BridgeMultisig";
import {bytesToHex, hexToBN} from "@/ton-bridge-lib/Paranoid";
import {Address} from "tonweb/dist/types/utils/address";

const fromNano = TonWeb.utils.fromNano;
const toNano = TonWeb.utils.toNano;

export default defineComponent({
  props: {
    isTestnet: { // immutable parameter from url
      type: Boolean,
      required: true,
    },
    isRecover: { // immutable parameter from url
      type: Boolean,
      required: true,
    },
    lt: { // immutable parameter from url
      type: Number,
      required: true,
    },
    hash: { // immutable parameter from url
      type: String,
      required: true,
    },
    isFromTon: {
      type: Boolean,
      required: true,
    },
    pair: { // "eth" or "bsc"
      type: String,
      required: true,
    },
    tokenAddress: { // Ethereum or TON token address
      type: String,
      required: true
    },
    tokenSymbol: {
      type: String,
      required: true
    },
    amount: { // float as string
      type: String,
      required: true,
    },
    token: { // "ton" | "usdt" | "usdc" | "dai" | "wbtc" | "otherTokens"
      type: String,
      required: true,
    },
    toAddress: { // Ethereum or TON to address
      type: String,
      required: true,
    },
    ethereumProvider: { // Ethereum provider
      type: Object as PropType<Provider>,
      required: true,
    },
    isInputsValid: {
      type: Boolean,
      required: true,
    },
  },

  data(): ComponentData {
    return {
      updateStateIntervalForToncoin: null, // setInterval ID
      updateStateIntervalForJettons: null, // setInterval ID
      providerDataForToncoin: null,
      providerDataForJettons: null,
      ethToTon: null,
      isInitInProgress: false,
      isMintingInProgress: false,
      isApprovingInProgress: false, // approving ERC-20 token in token transfer
      isGetAllowanceInProcess: false, // get allowance of ERC-20 token in token transfer
      isGetAllowanceError: true,
      isBurningInProgress: false,
      isLockingInProgress: false,

      isQRCodeShown: false,
      hasApprove: false,

      state: {
        swapId: "",
        queryId: "0",
        jettonEvmAddress: "",
        fromCurrencySent: false,
        toCurrencySent: false,
        step: 0, // 0-5 step
        votes: [], // EvmSignature[] for ton->evm, number[] for evm->ton
        swapData: null,
        burnData: null,
        createTime: 0,
        blockNumber: 0,
      },
    };
  },

  computed: {
    isToncoinTransfer(): boolean {
      return this.token === "ton";
    },
    netTypeName(): string {
      return this.isTestnet ? "test" : "main";
    },
    params(): ParamsNetwork {
      const pairParams = PARAMS.networks[this.pair];
      return pairParams[this.netTypeName as keyof typeof pairParams];
    },
    isMintToncoinButtonVisible(): boolean {
      if (this.isToncoinTransfer) {
        return (
            this.isFromTon && !this.state.toCurrencySent && this.state.step === 4
        );
      } else {
        if (this.isFromTon) {
          return (
              !this.state.toCurrencySent && this.state.step === 4
          );
        } else {
          return this.state.step == 3;
        }
      }
    },
    isDoneButtonVisible(): boolean {
      return this.state.step > 4;
    },
    isCancelButtonVisible(): boolean {
      return this.isFromTon && this.state.step === 1;
    },
    fromCoin(): string {
      return this.isFromTon
          ? this.$t(`networks.ton.${this.netTypeName}.coinShort`)
          : this.$t(`networks.${this.pair}.${this.netTypeName}.coinShort`);
    },
    toCoin(): string {
      if (this.isToncoinTransfer) {
        return !this.isFromTon
            ? this.$t(`networks.ton.${this.netTypeName}.coinShort`)
            : this.$t(`networks.${this.pair}.${this.netTypeName}.coinShort`);
      } else {
        return this.tokenSymbol;
      }
    },
    getStepInfoText1(): any {
      if (this.state.step === 1) {
        if (this.isFromTon) {
          if (this.isToncoinTransfer) {
            const url = PARAMS.tonTransferUrl
                .replace("<BRIDGE_ADDRESS>", this.params.tonBridgeAddress)
                .replace("<AMOUNT>", toNano(this.amount).toString())
                .replace("<TO_ADDRESS>", this.toAddress);
            return {
              isOnlyText: false,
              send1: this.$t("networks.ton.transactionSend1"),
              amountReadable: this.amount,
              send2: this.$t("networks.ton.transactionSend2"),
              toAddress: this.params.tonBridgeAddress,
              withComment: this.$t("networks.ton.transactionSendComment"),
              comment: "swapTo#" + this.toAddress,
              openWalletLabel: this.$t("networks.ton.openWallet"),
              openWalletUrl: url,
              generateQRCode: this.isQRCodeShown
                  ? ""
                  : this.$t("networks.ton.generateQRCode"),
              scanQRCode: this.isQRCodeShown
                  ? this.$t("networks.ton.scanQRCode")
                  : "",
            };
          } else {
            return {
              isOnlyText: true,
              text: this.state.fromCurrencySent
                  ? this.$t(`networks.${this.pair}.transactionWait`)
                  : this.$t(`networks.${this.pair}.transactionSend`, {
                    provider: "TON Wallet",
                  }),
            };
          }
        } else {
          return {
            isOnlyText: true,
            text: this.state.fromCurrencySent
                ? this.$t(`networks.${this.pair}.transactionWait`)
                : this.$t(`networks.${this.pair}.transactionSend`, {
                  provider: this.ethereumProvider.title,
                }),
          };
        }
      } else {
        const pair = this.isFromTon ? "ton" : this.pair;
        return {
          isOnlyText: true,
          text: this.$t(`networks.${pair}.transactionCompleted`),
        };
      }
    },
    getStepInfoText2(): string {
      if (this.isFromTon) {
        return "";
      }
      const providerData =
          this.isToncoinTransfer
              ? this.providerDataForToncoin
              : this.providerDataForJettons;

      if (this.state.step === 2) {
        let blocksConfirmations =
            (providerData?.blockNumber || this.state.blockNumber) -
            this.state.blockNumber;
        blocksConfirmations = Math.max(
            Math.min(blocksConfirmations, this.params.blocksConfirmations),
            0
        );
        return this.$t(`networks.${this.pair}.blocksConfirmations`, {
          count:
              String(blocksConfirmations) +
              "/" +
              String(this.params.blocksConfirmations),
        });
      } else if (this.state.step > 2) {
        return this.$t("blocksConfirmationsCollected");
      } else {
        return this.$t("blocksConfirmationsWaiting");
      }
    },
    getStepInfoText3(): string {
      if (!this.isToncoinTransfer && !this.isFromTon) {
        return this.getGetCoinsText(3);
      } else {
        return this.getOraclesText(3);
      }
    },
    getStepInfoText4(): string {
      if (!this.isToncoinTransfer && !this.isFromTon) {
        return this.getOraclesText(4);
      } else {
        return this.getGetCoinsText(4);
      }
    },
  },

  watch: {
    "state.step": {
      immediate: true,
      handler(val) {
        this.$emit("state-changed");
        this.$emit("transfer-in-progress", val > 0);
      },
    },
    token: {
      immediate: true,
      handler(newValue) {
        this.onTokenChange(newValue);
      },
    },
  },

  mounted(): void {
    this.$watch(
        () => this.amount + "_" + this.tokenAddress + "_" + this.ethereumProvider?.myAddress + "_" + this.token + "_" + this.isFromTon  + "_" + this.isInputsValid,
        debounce(async () => {
          this.checkAllowance();
        }, 300)
    );

    this.checkAllowance();
    this.$emit("ready");
  },

  beforeDestroy(): void {
    clearInterval(
        this.updateStateIntervalForToncoin as ReturnType<typeof setInterval>
    );
    clearInterval(
        this.updateStateIntervalForJettons as ReturnType<typeof setInterval>
    );
  },

  methods: {
    onCopyClick,
    makeAddress,
    parseEvmSignature,
    getQueryId,
    ...mapMutations({setAlert: "setAlert"}),
    async mint(): Promise<void> {
      if (this.isFromTon) {
        if (this.isToncoinTransfer) {
          await this.mintWrappedToncoin();
        } else {
          await this.unlockToken();
        }
      } else {
        if (this.isToncoinTransfer) {
          throw new Error('can never happen');
        } else {
          await this.mintJetton();
        }
      }
    },
    onTokenChange(newValue: string): void {
      clearInterval(
          this.updateStateIntervalForToncoin as ReturnType<typeof setInterval>
      );
      clearInterval(
          this.updateStateIntervalForJettons as ReturnType<typeof setInterval>
      );

      if (newValue === "ton") {
        this.updateStateForToncoin();
        this.updateStateIntervalForToncoin = setInterval(
            this.updateStateForToncoin,
            5000
        );
      } else {
        this.updateStateForJettons();
        this.updateStateIntervalForJettons = setInterval(
            this.updateStateForJettons,
            5000
        );
      }
    },


    getOraclesText(oraclesStep: number): string {
      if (this.state.step === oraclesStep) {
        const providerData =
            this.isToncoinTransfer
                ? this.providerDataForToncoin
                : this.providerDataForJettons;

        const votesConfirmations =
            this.state.votes.length +
            "/" +
            (providerData?.oraclesTotal || 0);
        return this.$t("oraclesConfirmations", {
          count: String(votesConfirmations),
        });
      } else if (this.state.step > oraclesStep) {
        return this.$t("oraclesConfirmationsCollected");
      } else {
        return this.$t("oraclesConfirmationsWaiting");
      }
    },

    getGetCoinsText(getCoinsStep: number): string {
      const toCoins = this.toCoin || this.$t("tokens")
      if (this.state.step === getCoinsStep) {
        return this.state.toCurrencySent
            ? this.$t(`networks.${this.pair}.transactionWait`)
            : this.$t("getCoinsByProvider", {
              provider: this.token === 'ton' ? this.ethereumProvider.title : 'TON Wallet',
              toCoin: toCoins,
            });
      } else if (this.state.step > getCoinsStep) {
        return this.$t("coinsSent", {toCoin: toCoins});
      } else {
        const pair = this.isFromTon ? this.pair : "ton";
        return this.$t("getCoins", {
          toCoin: toCoins,
          toNetwork: this.$t(`networks.${pair}.${this.netTypeName}.name`),
        });
      }
    },

    generateQRCode(): void {
      this.isQRCodeShown = true;

      const url = PARAMS.tonTransferUrl
          .replace("<BRIDGE_ADDRESS>", this.params.tonBridgeAddress)
          .replace("<AMOUNT>", toNano(this.amount).toString())
          .replace("<TO_ADDRESS>", this.toAddress);

      const options: Partial<Options> = {
        data: url,
        width: 225 * window.devicePixelRatio,
        height: 225 * window.devicePixelRatio,
        image: require("@/assets/pics/gem@large.png"),
        dotsOptions: {
          color: "#000000",
          type: "extra-rounded",
        },
        cornersSquareOptions: {
          color: "#000000",
          type: "extra-rounded",
        },
        cornersDotOptions: {
          color: "#000000",
          type: "dot",
        },
        imageOptions: {
          hideBackgroundDots: true,
          crossOrigin: "use-credentials",
          imageSize: 1,
        },
        qrOptions: {
          errorCorrectionLevel: "L",
        },
      };

      const qrCode = new QRCodeStyling(options);
      qrCode.append(this.$refs.qrcode as HTMLElement);
    },
    async initProvider(isToncoinTransfer: boolean): Promise<boolean> {
      if (isToncoinTransfer) {
        if (!this.providerDataForToncoin) {
          this.providerDataForToncoin = await this.initProviderForToncoin();
          if (!this.providerDataForToncoin) {
            return false;
          }
        }
      } else {
        if (!this.providerDataForJettons) {
          this.providerDataForJettons = await this.initProviderForJettons();
          if (!this.providerDataForJettons) {
            return false;
          }
        }
      }
      return true;
    },
    resetState(): void {
      this.state.swapId = "";
      this.state.queryId = "0";
      this.state.jettonEvmAddress = "";
      this.state.fromCurrencySent = false;
      this.state.toCurrencySent = false;
      this.state.step = 0;
      this.state.votes = [];
      this.state.swapData = null;
      this.state.burnData = null;
      this.state.createTime = 0;
      this.state.blockNumber = 0;

      this.isQRCodeShown = false;

      this.$emit("reset-state");
    },
    async loadState(state: any): Promise<boolean> {
      if (!state || !state.processingState) {
        return false;
      }

      this.isInitInProgress = true;
      const isToncoinTransfer = state.token === 'ton';
      if (!(await this.initProvider(isToncoinTransfer))) {
        this.isInitInProgress = false;
        return;
      }

      this.isInitInProgress = false;

      Object.assign(this.state, state.processingState);
      this.ethToTon = state.processingState.ethToTon;

      if (isToncoinTransfer) {
        await this.updateStateForToncoin();
      } else {
        await this.updateStateForJettons();
      }

      return true;
    },
    saveState(): void {
      this.$emit("save-state", {
        ...this.state,
        ethToTon: this.ethToTon,
      });
    },
    deleteState(): void {
      this.$emit("delete-state");
    },
    async updateStateForToncoin(): Promise<void> {
      const provider = this.providerDataForToncoin!;
      const web3 = this.ethereumProvider.web3!;

      // Step 1 - TON->EVM - find Toncoin transfer in TON network

      if (this.state.step === 1 && this.isFromTon) {
        const swap = await this.getSwapForToncoin(
            toNano(this.amount),
            this.toAddress,
            this.state.createTime
        );
        if (swap) {
          this.state.swapId = this.getSwapTonToEthIdForToncoin(swap);
          this.state.swapData = swap;
          this.state.step = 3;
        }
      }

      // Step 2 - EVM->TON - collect block confirmations after Burn wrapped Toncoins in EVM-network

      if (this.state.step === 2 && !this.isFromTon) {
        const blockNumber = await web3.eth.getBlockNumber();
        provider.blockNumber = blockNumber;

        console.log(blockNumber, this.state.blockNumber);

        const blocksConfirmations =
            (blockNumber || this.state.blockNumber) -
            this.state.blockNumber;

        if (blocksConfirmations > this.params.blocksConfirmations) {
          const receipt = await web3.eth.getTransactionReceipt(
              this.ethToTon!.transactionHash
          );
          this.ethToTon!.blockNumber = receipt.blockNumber;
          const block = await web3.eth.getBlock(
              receipt.blockNumber
          );
          this.ethToTon!.blockTime = Number(block.timestamp);
          this.ethToTon!.blockHash = block.hash;
          const log = ToncoinBridge.findLog(web3, this.ethToTon!.from, this.ethToTon!.value, this.ethToTon!.to.workchain.toString(), this.ethToTon!.to.address_hash, receipt.logs);
          if (!log) throw new Error('cant find log');
          this.ethToTon!.logIndex = log.logIndex;

          this.state.queryId = this.getQueryId(this.ethToTon!).toString();
          this.state.step = 3;
        }
      }

      // Step 3 - Collect oracles votes

      if (this.state.step === 3) {
        this.state.votes = this.isFromTon
            ? await this.getEthVoteForToncoin(this.state.swapId)
            : await this.getTonVoteForToncoin(this.state.queryId);
        if (
            this.state.votes.length >=
            (provider.oraclesTotal * 2) / 3
        ) {
          this.state.step = this.isFromTon ? 4 : 5;
        }
      }
    },
    async updateStateForJettons(): Promise<void> {
      const provider = this.providerDataForJettons!;
      const web3 = this.ethereumProvider.web3!;

      // Step 1 - TON->EVM - find jetton burn in TON network

      if (this.state.step === 1 && this.isFromTon) {
        const burn = await this.getSwapForJettons(
            this.toAddress,
            this.state.createTime
        );
        if (burn) {
          this.state.swapId = this.getSwapTonToEthIdForJettons(burn);
          this.state.burnData = burn;
          this.state.step = 3;
        }
      }

      // Step 2 - EVM->TON - collect block confirmations after Lock tokens in EVM-network

      if (this.state.step === 2 && !this.isFromTon) {
        const blockNumber = await web3.eth.getBlockNumber();
        provider.blockNumber = blockNumber;

        console.log(blockNumber, this.state.blockNumber);

        const blocksConfirmations =
            (blockNumber || this.state.blockNumber) -
            this.state.blockNumber;

        if (blocksConfirmations > this.params.blocksConfirmations) {
          const receipt = await web3.eth.getTransactionReceipt(
              this.ethToTon!.transactionHash
          );
          this.ethToTon!.blockNumber = receipt.blockNumber;
          const block = await web3.eth.getBlock(
              receipt.blockNumber
          );

          this.ethToTon!.blockTime = Number(block.timestamp);
          this.ethToTon!.blockHash = block.hash;

          const log = TokenBridge.findLog(web3, this.ethToTon!.from, this.ethToTon!.value, this.ethToTon!.to.address_hash, this.tokenAddress.toLowerCase(), receipt.logs);
          if (!log) throw new Error('cant find log');
          this.ethToTon!.logIndex = log.logIndex;

          this.state.queryId = this.getQueryId(this.ethToTon!).toString();
          this.state.step = 3;
        }
      }

      // Step 3

      if (this.state.step === 3) {
        if (this.isFromTon) { // TON->EVM - Collect oracles votes for jetton burn
          this.state.votes = await this.getEthVoteForJettons(this.state.swapId);

          if (
              this.state.votes.length >=
              (provider.oraclesTotal * 2) / 3
          ) {
            this.state.step = 4;
          }
        } else { // EVM->TON - find mint pay in TON Network
          const isPaid = await this.isJettonMintPaid(this.state.queryId);
          console.log('isPaid', this.state.queryId, isPaid);
          if (isPaid) {
            this.state.step = 4;
          }
        }
      }

      // Step 4 - Collect oracles votes for mint jetton in TON network

      if (this.state.step === 4 && !this.isFromTon) {
        this.state.votes = await this.getTonVoteForJettons(this.state.queryId);
        if (
            this.state.votes.length >=
            (provider.oraclesTotal * 2) / 3
        ) {
          this.state.step = 5;
        }
      }
    },
    getSwapTonToEthIdForToncoin(d: SwapTonToEth): string {
      const target = this.pair === "eth" && !this.isTestnet ? undefined : this.params.wTonAddress;
      return ToncoinBridge.getDataId(this.ethereumProvider.web3!, d, target)
    },
    getSwapTonToEthIdForJettons(d: BurnEvent): string {
      return TokenBridge.getDataId(this.ethereumProvider.web3!, d, this.params.tonBridgeV2EVMAddress, this.params.chainId);
    },

    getFeeAmountForToncoin(amount: BN): BN {
      const provider = this.providerDataForToncoin!;
      const rest = amount.sub(provider.feeFlat);
      const percentFee = rest
          .mul(provider.feeFactor)
          .div(provider.feeBase);
      return provider.feeFlat.add(percentFee);
    },

    async getSwapForToncoin(
        myAmount: BN,
        myToAddress: string,
        myCreateTime: number
    ): Promise<null | SwapTonToEth> {
      const amountAfterFee = myAmount.sub(this.getFeeAmountForToncoin(myAmount));

      const specifiedTransaction = this.lt && this.hash; // get specified transaction by its lt and hash
      const isRecover = this.isRecover; // ignore createTime and find in more transactions

      const provider = this.providerDataForToncoin!.tonweb.provider;

      let transactions;

      if (specifiedTransaction) {
        console.log('Get Toncoin specified tx ' + this.lt + ':' + this.hash);
        transactions = await provider.getTransactions(
            this.params.tonBridgeAddress,
            1,
            this.lt,
            this.hash,
            undefined,
            true
        );
      } else {
        const limit = isRecover ? 200 : 40;
        console.log(`Find Toncoin swap - get ${limit} ton txs`);
        transactions = await provider.getTransactions(
            this.params.tonBridgeAddress,
            limit
        );
      }

      console.log(`Find Toncoin swap - got ton ${transactions.length} txs`);

      for (const t of transactions) {
        if (!isRecover && !specifiedTransaction) {
          if (t.utime * 1000 < myCreateTime) continue;
        }

        const event = ToncoinBridge.processTonTransaction(t);

        if (event) {
          console.log(JSON.stringify(event));

          if (
              new BN(event.amount).eq(amountAfterFee) &&
              event.receiver.toLowerCase() === myToAddress.toLowerCase()
          ) {
            return event;
          }
        }
      }
      return null;
    },

    async isJettonMintPaid(queryId: string): Promise<boolean> {
      const provider = this.providerDataForJettons!.tonweb.provider;
      const isRecover = this.isRecover; // ignore createTime and find in more transactions
      const limit = isRecover ? 200 : 40;
      console.log(`Find Token paid - get ${limit} ton txs`);

      const transactions: any[] =
          await provider.getTransactions(
              this.params.tonBridgeAddressV2,
              limit
          );

      console.log(`Find Token paid - got ${transactions.length} ton txs`);

      for (const t of transactions) {
        const event = TokenBridge.processPayJettonMintTransaction(t);
        if (event && event.queryId === queryId) {
          console.log(event);
          return true;
        }
      }
      return false;
    },

    async getSwapForJettons(
        // myAmount: BN,
        myToAddress: string,
        myCreateTime: number
    ): Promise<null | BurnEvent> {
      const specifiedTransaction = this.lt && this.hash; // get specified transaction by its lt and hash
      const isRecover = this.isRecover; // ignore createTime and find in more transactions

      const provider = this.providerDataForJettons!.tonweb.provider;

      let transactions;

      if (specifiedTransaction) {
        console.log('Get Token specified tx ' + this.lt + ':' + this.hash);
        transactions = await provider.getTransactions(
            this.params.tonBridgeAddressV2,
            1,
            this.lt,
            this.hash,
            undefined,
            true
        );
      } else {
        const limit = isRecover ? 200 : 40;
        console.log(`Find Token swap - get ${limit} ton txs`);
        transactions = await provider.getTransactions(
            this.params.tonBridgeAddressV2,
            limit
        );
      }

      console.log(`Find Token swap - got ton ${transactions.length} txs`);

      for (const t of transactions) {
        if (!isRecover && !specifiedTransaction) {
          if (t.utime * 1000 < myCreateTime) continue;
        }

        const event = TokenBridge.processTonTransaction(t);

        if (event) {
          console.log(JSON.stringify(event));

          if (
              event.ethReceiver.toLowerCase() === myToAddress.toLowerCase() &&
              this.state.jettonEvmAddress.toLocaleLowerCase() === event.token.toLocaleLowerCase()
          ) {
            // const swapId = this.getSwapTonToEthIdForJettons(event);
            // let isVotingFinished = true;
            // try {
            //   isVotingFinished =
            //       await this.providerDataForJettons!.bridgeContract.methods.finishedVotings(
            //           swapId
            //       ).call();
            // } catch (error) {
            //   console.error(error);
            //   return null;
            // }
            // if (!isVotingFinished) {
            // }
            return event;
          }
        }
      }
      return null;
    },
    async getEthVoteForToncoin(voteId: string): Promise<EvmSignature[]> {
      const result = await getEvmSignaturesFromCollector(this.providerDataForToncoin!.tonweb as any, this.params.tonCollectorAddress, voteId);
      return result ? result.signatures : [];
    },
    async getEthVoteForJettons(voteId: string): Promise<EvmSignature[]> {
      const result = await getEvmSignaturesFromCollector(this.providerDataForJettons!.tonweb as any, this.params.tonCollectorAddressV2, voteId);
      return result ? result.signatures : [];
    },
    async getTonVoteForToncoin(queryId: string): Promise<number[]> {
      return getVotesInMultisig(this.providerDataForToncoin!.tonweb as any, this.params.tonMultisigAddress, queryId, this.providerDataForToncoin!.oraclesTotal);
    },
    async getTonVoteForJettons(queryId: string): Promise<number[]> {
      return getVotesInMultisig(this.providerDataForJettons!.tonweb as any, this.params.tonMultisigAddressV2, queryId, this.providerDataForJettons!.oraclesTotal);
    },
    onDoneClick(): void {
      this.deleteState();
      this.resetState();
    },
    onCancelClick(): void {
      this.deleteState();
      this.resetState();
    },
    /**
     * Validate that Ethereum provider connected, has valid chain and ETH balance > 0
     */
    async validateEthereumProvider(): Promise<boolean> {
      try {
        if (!this.ethereumProvider.isConnected) {
          const error = this.$t("errors.providerIsDisconnected", {
            provider: this.ethereumProvider.title,
          });
          throw new Error(error);
        }

        if (!this.ethereumProvider.myAddress) {
          throw new Error(this.$t("errors.cantGetAddress"));
        }

        if (this.ethereumProvider.chainId !== this.params.chainId) {
          const error = this.$t("errors.wrongProviderNetwork", {
            network: this.$t(`networks.${this.pair}.${this.netTypeName}.name`),
            provider: this.ethereumProvider.title,
          });
          throw new Error(error);
        }

        if (
            !new BN(
                await this.ethereumProvider.web3!.eth.getBalance(this.ethereumProvider.myAddress)
            ).gt(new BN("0"))
        ) {
          throw new Error(this.$t(`networks.${this.pair}.errors.lowBalance`));
        }
      } catch (e: any) {
        console.error(e.message);
        this.setAlert({
          title: this.$t("errors.alertTitleError"),
          message: e.message,
          buttonLabel: this.$t("errors.alertButtonClose"),
        });
        return false;
      }

      return true;
    },
    async debugVoteForSwitchLock(): Promise<void> {
      const unlockSignatures = [
        {
          signer: '0xe54CD631C97bE0767172AD16904688962d09d2FE',
          signature: '0x53d5ede513368f6b01d88520b51cabdbd07a23d8b91614a211962c68165ef7b4726ea200897d8db55861c1e8862289321fc13579027c773572d6248deab761911c'
        },
        {
          signer: '0xeb05E1B6AC0d574eF2CF29FDf01cC0bA3D8F9Bf1',
          signature: '0xc931c3b089eece0b4cc150d387d4d1fbf65d75eff2e409b8b99738cc08cfe3573b6f16ee6c206ee968b5216dae04526c1a79d83ec025a0b93c733ecbc9f881371b'
        },
      ].sort((a, b) => {
        return hexToBN(a.signer).cmp(hexToBN(b.signer));
      });

      await this.providerDataForJettons!.bridgeContract.methods
          .voteForSwitchLock(true, 1, unlockSignatures)
          .send({from: this.ethereumProvider.myAddress});
    },
    /**
     * Mint Wrapped ERC-20 Toncoin in EVM network
     * Last step in transfer
     */
    async mintWrappedToncoin(): Promise<void> {
      if (this.isMintingInProgress) return;

      if (!(await this.validateEthereumProvider())) return;

      this.isMintingInProgress = true;

      let receipt;
      try {
        const signatures = prepareEthSignatures(this.state.votes as EvmSignature[]);

        receipt =
            await this.providerDataForToncoin!.wtonContract.methods.voteForMinting(
                this.state.swapData!,
                signatures
            )
                .send({from: this.ethereumProvider.myAddress})
                .on("transactionHash", () => {
                  this.state.toCurrencySent = true;
                  this.isMintingInProgress = false;
                  this.deleteState();
                });
      } catch (e) {
        console.error(e);
        this.isMintingInProgress = false;
        return;
      }

      this.isMintingInProgress = false;

      if (receipt.status) {
        this.state.step = 5;
        this.deleteState();
      } else {
        console.error("transaction fail", receipt);
      }
    },
    /**
     * Burn Wrapped ERC-20 Toncoin in EVM network
     * First step in transfer
     */
    async burnWrappedToncoin(): Promise<void> {
      if (this.isBurningInProgress) {
        return;
      }

      if (!(await this.validateEthereumProvider())) {
        return;
      }

      const fromAddress = this.ethereumProvider.myAddress;
      const toAddress = this.toAddress;
      let amountUnits: string;
      let wc: number;
      let hashPart: string;

      this.isBurningInProgress = true;

      let receipt;
      try {

        const addressTon = new TonWeb.utils.Address(toAddress);
        wc = addressTon.wc;
        hashPart = bytesToHex(addressTon.hashPart);

        amountUnits = toNano(this.amount).toString();

        receipt = await this.providerDataForToncoin!.wtonContract.methods.burn(
            amountUnits,
            {
              workchain: wc,
              address_hash: "0x" + hashPart,
            }
        )
            .send({from: fromAddress})
            .on("transactionHash", () => {
              this.state.fromCurrencySent = true;
            });
      } catch (e) {
        this.isBurningInProgress = false;
        console.error(e);
        this.resetState();
        return;
      }

      if (receipt.status) {
        console.log("receipt", receipt);

        this.state.blockNumber = receipt.blockNumber;
        this.ethToTon = {
          type: 'SwapEthToTon',
          transactionHash: receipt.transactionHash,
          logIndex: -1,
          blockNumber: receipt.blockNumber,
          blockTime: 0,
          blockHash: "",

          from: fromAddress,
          to: {
            workchain: wc,
            address_hash: hashPart,
          },
          value: amountUnits,

          rawData: receipt.rawData,
          topics: receipt.topics,
          transactionIndex: receipt.transactionIndex
        };
        this.isBurningInProgress = false;
        this.state.step = 2;
      } else {
        this.isBurningInProgress = false;
        console.error("transaction fail", receipt);
      }
    },
    /**
     * Check allowance of ERC-20 token for token bridge in EVM network
     */
    async checkAllowance(): Promise<void> {
      console.log('checkAllowance ' +  this.tokenAddress);
      if (this.isFromTon || this.isToncoinTransfer || !this.isInputsValid || !this.ethereumProvider || !Web3.utils.isAddress(this.tokenAddress) || !this.amount) {
        console.log('checkAllowance invalid values');
        this.hasApprove = false;
        this.isGetAllowanceError = true;
        return;
      }
      const amount = this.amount;
      const tokenAddress = this.tokenAddress
      const myAddress: string = this.ethereumProvider.myAddress;

      try {
        this.isGetAllowanceInProcess = true;
        const erc20Contract = new ERC20Contract(this.ethereumProvider);
        const decimals = await erc20Contract.decimals({
          address: tokenAddress
        });
        const amountUnits = parseUnits(amount, decimals).toString();
        const allowanceUnits = await erc20Contract.allowance({
          address: tokenAddress,
          spender: this.params.tonBridgeV2EVMAddress,
          owner: myAddress,
        });
        if (this.tokenAddress == tokenAddress && this.amount === amount && this.ethereumProvider?.myAddress === myAddress) {
          console.log(allowanceUnits.toString());
          console.log(amountUnits.toString());
          this.hasApprove = new BN(allowanceUnits.toString()).gte(new BN(amountUnits));
          this.isGetAllowanceInProcess = false;
          this.isGetAllowanceError = false;
        }
      } catch (e) {
        console.error(e);
        this.hasApprove = false;
        this.isGetAllowanceInProcess = false;
        this.isGetAllowanceError = true;
      }
    },
    /**
     * Approve ERC-20 token for token bridge in EVM network
     */
    async onApproveClick(): Promise<void> {
      if (this.isApprovingInProgress) {
        return;
      }

      if (!this.isInputsValid) return;

      if (!(await this.validateEthereumProvider())) {
        return;
      }

      this.isApprovingInProgress = true;

      const maxAmount = MaxInt256.toString();
      try {
        const erc20Contract = new ERC20Contract(this.ethereumProvider);
        const tx = await erc20Contract.approve({
          address: this.tokenAddress,
          spender: this.params.tonBridgeV2EVMAddress,
          amount: maxAmount,
        });
        await tx.wait();
        this.hasApprove = true;
        this.isApprovingInProgress = false;
      } catch (e: any) {
        console.error(e);
        this.isApprovingInProgress = false;

        this.setAlert({
          title: this.$t("errors.alertTitleError"),
          message: e.message,
          buttonLabel: this.$t("errors.alertButtonClose"),
        });
      }
    },
    /**
     * Lock ERC-20 token in EVM network
     * First step in transfer
     */
    async lockToken(amountUnits: BN): Promise<void> {
      if (this.isBurningInProgress) {
        return;
      }

      if (!(await this.validateEthereumProvider())) {
        return;
      }

      const fromAddress = this.ethereumProvider.myAddress;
      const toAddress = this.toAddress;
      let wc: number;
      let hashPart: string;

      this.isBurningInProgress = true;

      let receipt;
      try {

        const addressTon = new TonWeb.utils.Address(toAddress);
        wc = addressTon.wc;
        if (wc !== 0) throw new Error('Only basechain wallets supported');
        hashPart = bytesToHex(addressTon.hashPart);

        receipt = await this.providerDataForJettons!.bridgeContract.methods.lock(
            this.tokenAddress, // token
            amountUnits.toString(), // amount
            "0x" + hashPart // to_address_hash
        )
            .send({from: fromAddress})
            .on("transactionHash", () => {
              this.state.fromCurrencySent = true;
            });
      } catch (e) {
        this.isBurningInProgress = false;
        console.error(e);
        this.resetState();
        return;
      }

      if (receipt.status) {
        console.log("receipt", receipt);

        this.state.blockNumber = receipt.blockNumber;

        this.state.blockNumber = receipt.blockNumber;
        this.ethToTon = {
          type: 'SwapEthToTon',
          transactionHash: receipt.transactionHash,
          logIndex: -1,
          blockNumber: receipt.blockNumber,
          blockTime: 0,
          blockHash: "",
          from: fromAddress,
          to: {
            workchain: wc,
            address_hash: hashPart,
          },
          value: amountUnits.toString(),

          rawData: receipt.rawData,
          topics: receipt.topics,
          transactionIndex: receipt.transactionIndex
        };

        this.isBurningInProgress = false;
        this.state.step = 2;
        this.saveState();
      } else {
        this.isBurningInProgress = false;
        console.error("transaction fail", receipt);
      }
    },
    /**
     * Unlock ERC-20 token in EVM network
     * Last step in transfer
     */
    async unlockToken(): Promise<void> {
      if (this.isMintingInProgress) return;

      if (!(await this.validateEthereumProvider())) return;

      this.isMintingInProgress = true;

      let receipt;
      try {
        const signatures = prepareEthSignatures(this.state.votes as EvmSignature[]);

        const burnData: BurnEvent = this.state.burnData;
        if (!burnData) throw new Error('No burn data');


        receipt =
            await this.providerDataForJettons!.bridgeContract.methods.unlock(
                {
                  receiver: burnData.ethReceiver,
                  token: burnData.token,
                  amount: burnData.jettonAmount,
                  tx: {
                    address_hash: burnData.tx.address_.address_hash,
                    tx_hash: burnData.tx.tx_hash,
                    lt: burnData.tx.lt
                  }
                },
                signatures,
            )
                .send({from: this.ethereumProvider.myAddress})
                .on("transactionHash", () => {
                  this.state.toCurrencySent = true;
                  this.isMintingInProgress = false;
                  this.deleteState();
                });
      } catch (error) {
        console.error(error);
        this.isMintingInProgress = false;
        return;
      }

      this.isMintingInProgress = false;

      if (receipt.status) {
        this.state.step = 5;
        this.deleteState();
      } else {
        console.error("transaction fail", receipt);
      }
    },
    /**
     * Pay mint jetton in TON Network
     * Last action in transfer
     */
    async mintJetton(): Promise<void> {
      if (this.isBurningInProgress) {
        return;
      }

      if (!this.providerDataForJettons) return;

      this.isBurningInProgress = true;

      try {
        await mintJetton({
          tonWallet: this.providerDataForJettons.tonWallet,
          queryId: this.state.queryId,
          bridgeTonAddress: this.params.tonBridgeAddressV2
        });
        this.isBurningInProgress = false;
      } catch (error) {
        this.isBurningInProgress = false;

        console.error(error);
        this.resetState();
      }
    },
    /**
     * Burn jetton in TON network
     * First step in transfer
     */
    async burnJetton(amountUnits: BN, jettonWalletAddress: Address): Promise<void> {
      if (this.isBurningInProgress) {
        return;
      }

      if (!this.providerDataForJettons) return;

      this.isBurningInProgress = true;

      try {
        const destinationAddress = hexToBN(this.ethereumProvider.myAddress);
        await burnJetton({
          tonWallet: this.providerDataForJettons.tonWallet,
          destinationAddress,
          userTonAddress: this.providerDataForJettons.myAddreess,
          jettonWalletAddress,
          jettonAmountWithDecimals: amountUnits
        });
        this.isBurningInProgress = false;
        this.saveState();
      } catch (error) {
        this.isBurningInProgress = false;

        console.error(error);
        this.resetState();
      }
    },
    /**
     * Prepare for Toncoin transfer
     * Create wrappers for Ethereum and TON bridge smart contracts, get bridge configuration
     */
    async initProviderForToncoin(): Promise<ProviderDataForToncoin | null> {
      if (!(await this.validateEthereumProvider())) {
        return null;
      }

      const wtonContract = new this.ethereumProvider.web3!.eth.Contract(
          WTON_BRIDGE as AbiItem[],
          this.params.wTonAddress
      );
      const oraclesTotal = (
          await wtonContract.methods.getFullOracleSet().call()
      ).length;

      if (!(oraclesTotal > 0)) {
        return null;
      }

      const tonweb = new TonWeb(
          new TonWeb.HttpProvider(this.params.tonCenterUrl, {
            apiKey: this.params.tonCenterApiKey,
          })
      );

      const bridgeData = (
          await tonweb.provider.call(
              this.params.tonBridgeAddress,
              "get_bridge_data",
              []
          )
      ).stack;

      if (bridgeData.length !== 8) {
        console.error("Invalid bridge data", bridgeData);
        return null;
      }

      // const stateFlags = getNumber(bridgeData[0]);
      // const totalLocked = getNumber(bridgeData[1]);
      // const collectorWc = getNumber(bridgeData[2]);
      // const collectorAddr = bridgeData[3][1]; // string

      const feeFlat = hexToBN(bridgeData[4][1]);
      const feeNetwork = hexToBN(bridgeData[5][1]);
      const feeFactor = hexToBN(bridgeData[6][1]);
      const feeBase = hexToBN(bridgeData[7][1]);

      const res: ProviderDataForToncoin = {
        blockNumber: 0,
        wtonContract,
        tonweb,
        oraclesTotal,
        feeFlat: feeFlat.add(feeNetwork),
        feeFactor,
        feeBase,
      };

      return res;
    },
    /**
     * Prepare for Token transfer
     * Connect TON Extension
     * Create wrappers for Ethereum and TON bridge smart contracts, get bridge configuration
     */
    async initProviderForJettons(): Promise<ProviderDataForJettons | null> {
      if (!(await this.validateEthereumProvider())) {
        return null;
      }

      const tonWallet = (window as any).ton;

      if (!tonWallet) {
        this.setAlert({
          title: this.$t("errors.alertTitleError"),
          message: "Please install MyTonWallet",
          link: "https://chrome.google.com/webstore/detail/mytonwallet/fldfpgipfncgndfolcbkdeeknbbbnhcc",
          linkText: 'Install',
          buttonLabel: this.$t("errors.alertButtonClose"),
        });
        return null;
      }

      const wallets =
          (await tonWallet.send(
              "ton_requestWallets",
              []
          )) as any;

      const walletAddress = wallets[0].address;
      console.log('wallet', walletAddress)
      const userTonAddress = new TonWeb.Address(walletAddress);
      if (userTonAddress.wc !== 0) {
        this.setAlert({
          title: this.$t("errors.alertTitleError"),
          message: "Only basechain wallets supported",
          buttonLabel: this.$t("errors.alertButtonClose"),
        });
        return;
      }

      const bridgeContract = new this.ethereumProvider.web3!.eth.Contract(
          BRIDGE.abi as AbiItem[],
          this.params.tonBridgeV2EVMAddress
      );

      const oraclesTotal = (await bridgeContract.methods.getFullOracleSet().call())
          .length;

      if (!(oraclesTotal > 0)) {
        return null;
      }

      const tonweb = new TonWeb(
          new TonWeb.HttpProvider(this.params.tonCenterUrl, {
            apiKey: this.params.tonCenterApiKey,
          })
      );

      const userTonBalance: string = await tonweb.provider.getBalance(walletAddress);
      console.log('userTonBalance', userTonBalance.toString())
      if (new BN(userTonBalance).lt(toNano("1"))) {
        this.setAlert({
          title: this.$t("errors.alertTitleError"),
          message: "You need at least 1 TON on wallet balance",
          buttonLabel: this.$t("errors.alertButtonClose"),
        });
        return;
      }

      const res: ProviderDataForJettons = {
        blockNumber: 0,
        bridgeContract,
        tonweb,
        oraclesTotal,
        myAddress: walletAddress,
        tonWallet,
      };

      return res;
    },
    /**
     * Start transfer
     * Check that user has enough balance
     * Toncoin TON->EVM - ask user to send Toncoins to bridge in TON network
     * Toncoin EVM->TON - burn wrapped ERC-20 Toncoins in EVM network
     * Tokens EVM->TON - lock ERC-20 token in EVM network
     * Token TON->EVM - burn jetton in TON Network
     */
    async onTransferClick(): Promise<void> {
      if (this.isInitInProgress) return;

      if (!this.isInputsValid) return;

      this.isInitInProgress = true;

      // Prepare

      if (!(await this.initProvider(this.isToncoinTransfer))) {
        this.isInitInProgress = false;
        return;
      }

      // Start transfer

      if (this.isToncoinTransfer) {

        // Check balances

        if (!this.isFromTon) { // EVM->TON Toncoin Transfer, check that user have `amount` of ERC-20 wrapped toncoins before Burn
          try {
            const userErcBalance = new BN(
                await this.providerDataForToncoin.wtonContract.methods
                    .balanceOf(this.ethereumProvider.myAddress)
                    .call()
            );
            if (toNano(this.amount).gt(userErcBalance)) {
              this.$emit("error", {
                input: "amount",
                message: this.$t("errors.toncoinBalance", {
                  coin: "TONCOIN",
                  balance: fromNano(userErcBalance).toString(),
                }),
              });

              this.isInitInProgress = false;
              return;
            }
          } catch (e) {
            console.error(e);
            this.isInitInProgress = false;
            return;
          }
        }
        this.isInitInProgress = false;

        // Go

        this.state.createTime = Date.now();
        this.state.step = 1;

        if (this.isFromTon) {
          this.saveState(); // ask user to send Toncoins to bridge in TON network
        } else {
          await this.burnWrappedToncoin(); // invoke Ethereum wallet to burn ERC-20 wrapped toncoins
        }

      } else { // Token transfer

        // Check balances

        let amountUnits: BN;
        let jettonWalletAddress: Address;

        if (!this.isFromTon) { // EVM->TON Token transfer, check that user have `amount` of ERC-20 tokens before Lock
          try {
            const erc20Contract = new ERC20Contract(this.ethereumProvider);
            const decimals = await erc20Contract.decimals({
              address: this.tokenAddress,
            });
            amountUnits = new BN(
                parseUnits(this.amount, decimals).toString()
            );
            const balance = new BN(
                (
                    await erc20Contract.balanceOf({
                      address: this.tokenAddress,
                      account: this.ethereumProvider.myAddress,
                    })
                ).toString()
            );
            if (!balance.gte(amountUnits)) {
              this.$emit("error", {
                input: "amount",
                message: this.$t("errors.toncoinBalance", {
                  coin: this.tokenSymbol,
                  balance: formatUnits(balance.toString(), decimals),
                }),
              });

              this.isInitInProgress = false;
              return;
            }
          } catch (e) {
            console.error(e);
            this.isInitInProgress = false;
            return;
          }
        } else { // TON->EVM Token transfer, make checks

          // check jetton

          let jettonEvmAddress: string;
          let decimals: number;

          try {
            const wrappedTokenData = await getWrappedTokenData(
                    this.providerDataForJettons.tonweb,
                    this.tokenAddress
                );
            const chainId = wrappedTokenData.chainId;
            if (chainId !== this.ethereumProvider.chainId) {
              throw new Error("Jetton from different chain")
            }
            decimals = wrappedTokenData.decimals;
            jettonEvmAddress = wrappedTokenData.tokenAddress;
            const wrappedTokenDataCell = TokenBridge.createWrappedTokenData(chainId, jettonEvmAddress, decimals);
            const referenceMinterAddress = await getJettonMinterAddress(
                this.providerDataForJettons.tonweb,
                this.params.tonBridgeAddressV2,
                wrappedTokenDataCell
            );
            if (referenceMinterAddress.toString(false) !== new TonWeb.Address(this.tokenAddress).toString(false)) {
              throw new Error("Jetton does not belong to this bridge");
            }
          } catch (e) {
            console.error(e);
            this.isInitInProgress = false;
            return;
          }

          // check that user have `amount` of Jettons before Burn
          try {

            jettonWalletAddress = await getJettonWalletAddress({
              tonweb: this.providerDataForJettons.tonweb,
              userTonAddress: new TonWeb.Address(this.providerDataForJettons.myAddress),
              tokenAddress: this.tokenAddress,
            });

            this.state.jettonEvmAddress = jettonEvmAddress;
            console.log("myAddress", this.providerDataForJettons.myAddress.toString())
            console.log("decimals", decimals.toString())
            console.log("jettonEvmAddress", jettonEvmAddress.toString())
            console.log("jettonWalletAddress", jettonWalletAddress.toString(true, true, true))

            const balance = await getJettonWalletBalance(
                this.providerDataForJettons.tonweb,
                jettonWalletAddress!.toString(true, true, true)
            );
            console.log("balance", balance.toString())

            amountUnits = new BN(parseUnits(this.amount, decimals).toString());

            if (!balance.gte(amountUnits)) {
              this.$emit("error", {
                input: "amount",
                message: this.$t("errors.toncoinBalance", {
                  coin: this.tokenSymbol,
                  balance: formatUnits(balance.toString(), decimals),
                }),
              });

              this.isInitInProgress = false;
              return;
            }
          } catch (e) {
            console.error(e);
            this.isInitInProgress = false;
            return;
          }
        }

        this.isInitInProgress = false;

        // Go

        this.state.createTime = Date.now();
        this.state.step = 1;

        if (this.isFromTon) { // TON->EVM token transfer - Burn jettons
          await this.burnJetton(amountUnits, jettonWalletAddress); // invoke TON wallet to burn jettons

        } else { // EVM->TON token transfer - Lock ERC-20 Tokens
          await this.lockToken(amountUnits); // invoke Ethereum wallet to lock ERC-20 tokens
        }
      }
    },
  },
});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
