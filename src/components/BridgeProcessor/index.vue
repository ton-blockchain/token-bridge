<template>
  <div class="BridgeProcessor">
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

    <button
      class="BridgeProcessor-transfer"
      :class="{ showLoader: isApprovingInProgress }"
      v-if="state.step === 0 && !isFromTon && !hasApprove && token !== 'ton'"
      @click="approve"
    >
      Approve
    </button>

    <button
      v-if="isCancelVisible"
      class="BridgeProcessor-cancel"
      @click="onCancelClick"
    >
      {{ $t("cancel") }}
    </button>

    <div class="BridgeProcessor-infoWrapper" v-if="state.step > 0">
      <div v-if="token === 'ton'" class="BridgeProcessor-infoLine">
        <div
          class="BridgeProcessor-info-icon"
          :class="{
            none: state.step < 1,
            pending: state.step === 1,
            done: state.step > 1,
          }"
        ></div>
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
              {{ getStepInfoText1.send2 }}<br />
              <button
                class="BridgeProcessor-info-text-copy"
                @click="onCopyClick"
              >
                {{ getStepInfoText1.toAddress }}</button
              ><br />
              {{ getStepInfoText1.withComment }}<br />
              <button
                class="BridgeProcessor-info-text-copy"
                @click="onCopyClick"
              >
                {{ getStepInfoText1.comment }}</button
              ><br />
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

    <button
      v-if="isGetTonCoinVisible"
      class="BridgeProcessor-getTonCoin"
      :class="{ showLoader: isMintingInProgress }"
      @click="mint"
    >
      {{ $t("getToncoin", { coin: toCoin }) }}
    </button>

    <button
      v-if="isDoneVisible"
      class="BridgeProcessor-done"
      @click="onDoneClick"
    >
      {{ $t("done") }}
    </button>
  </div>
</template>

<script lang="ts">
import { MaxInt256 } from "@ethersproject/constants";
import { formatUnits, parseUnits } from "@ethersproject/units";
import BN from "bn.js";
import { ethers } from "ethers";
import { debounce } from "lodash";
import QRCodeStyling, { Options } from "qr-code-styling";
import TonWeb from "tonweb";
import { defineComponent, PropType } from "vue";
import { mapMutations } from "vuex";
import Web3 from "web3";
import { AbiItem } from "web3-utils";

import BRIDGE from "@/ton-bridge-lib/abi/TokenBridge.json";
import WTON_BRIDGE from "@/ton-bridge-lib/abi/WTON.json";
import {
  getJettonWalletAddress,
  getJettonWalletData,
  getWrappedTokenData,
} from "@/ton-bridge-lib/BridgeJettonUtils";
import {burnJetton, mintJetton} from "@/api/tonWallet";
import { onCopyClick } from "@/utils";
import { PARAMS } from "@/utils/constants";
import {
  getEvmSignaturesFromCollector,
  parseEvmSignature
} from "@/ton-bridge-lib/BridgeCollector";
import {
  getQueryId
} from "@/ton-bridge-lib/BridgeCommon";
import { Provider } from "@/utils/providers/provider";
import { BridgeContract } from "@/utils/services/Bridge.contract";
import { ERC20Contract } from "@/utils/services/ERC20.contract";

import {
  ComponentData,
  ProviderDataForJettons,
  ProviderDataForTON,
} from "./types";
import {SwapTonToEth, ToncoinBridge} from "@/ton-bridge-lib/ToncoinBridge";
import {BurnEvent, TokenBridge} from "@/ton-bridge-lib/TokenBridge";
import {EvmSignature} from "@/ton-bridge-lib/BridgeCollector";
import {findLogOutMsg, getMessageBytes, getNumber, makeAddress} from "@/ton-bridge-lib/BridgeTonUtils";
import {getVotesInMultisig} from "@/ton-bridge-lib/BridgeMultisig";

const fromNano = TonWeb.utils.fromNano;

export default defineComponent({
  props: {
    isTestnet: {
      type: Boolean,
      required: true,
    },
    isRecover: {
      type: Boolean,
      required: true,
    },
    lt: {
      type: Number,
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    isFromTon: {
      type: Boolean,
      required: true,
    },
    pair: {
      type: String,
      required: true,
    },
    tokenAddress: { type: String, required: true },
    tokenSymbol: { type: String, required: true },
    amount: {
      type: Object as PropType<BN>,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },

    toAddress: {
      type: String,
      required: true,
    },
    provider: {
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
      updateStateIntervalForTon: null,
      updateStateIntervalForJettons: null,
      providerDataForTon: null,
      providerDataForJettons: null,
      ethToTon: null,
      isInitInProgress: false,
      isMintingInProgress: false,
      isApprovingInProgress: false,
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
        step: 0,
        votes: null,
        swapData: null,
        burnData: null,
        createTime: 0,
        blockNumber: 0,
      },
    };
  },

  computed: {
    netTypeName(): string {
      return this.isTestnet ? "test" : "main";
    },
    params() {
      const pairParams = PARAMS.networks[this.pair];
      return pairParams[this.netTypeName as keyof typeof pairParams];
    },
    isGetTonCoinVisible(): boolean {
      if (this.token === "ton") {
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
    isDoneVisible(): boolean {
      return this.state.step > 4;
    },
    isCancelVisible(): boolean {
      return this.isFromTon && this.state.step === 1;
    },
    fromCoin() {
      return this.isFromTon
        ? this.$t(`networks.ton.${this.netTypeName}.coinShort`)
        : this.$t(`networks.${this.pair}.${this.netTypeName}.coinShort`);
    },
    toCoin() {
      if (this.token === "ton") {
        return !this.isFromTon
          ? this.$t(`networks.ton.${this.netTypeName}.coinShort`)
          : this.$t(`networks.${this.pair}.${this.netTypeName}.coinShort`);
      } else {
        return this.tokenSymbol;
      }
    },
    getStepInfoText1() {
      if (this.state.step === 1) {
        if (this.isFromTon) {
          if (this.token === "ton") {
            const url = PARAMS.tonTransferUrl
              .replace("<BRIDGE_ADDRESS>", this.params.tonBridgeAddress)
              .replace("<AMOUNT>", this.amount.toString())
              .replace("<TO_ADDRESS>", this.toAddress);
            return {
              isOnlyText: false,
              send1: this.$t("networks.ton.transactionSend1"),
              amountReadable: fromNano(this.amount),
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
          } else return {};
        } else {
          return {
            isOnlyText: true,
            text: this.state.fromCurrencySent
              ? this.$t(`networks.${this.pair}.transactionWait`)
              : this.$t(`networks.${this.pair}.transactionSend`, {
                  provider: this.provider.title,
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
        this.token === "ton"
          ? this.providerDataForTon
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
      if (this.token !== "ton" && !this.isFromTon) {
        return this.getGetCoinsText(3);
      } else {
        return this.getOraclesText(3);
      }
    },
    getStepInfoText4(): string {
      if (this.token !== "ton" && !this.isFromTon) {
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

  mounted() {
    this.$watch(
      () => [this.amount],
      debounce(async ([newAmount]: any) => {
        this.checkApprove(newAmount);
      }, 300)
    );

    this.$emit("ready");
  },

  beforeDestroy() {
    clearInterval(
      this.updateStateIntervalForTon as ReturnType<typeof setInterval>
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
    ...mapMutations({ setAlert: "setAlert" }),
    async mint() {
      if (this.isFromTon) {
        if (this.token === "ton") {
          await this.mintForTon();
        } else {
          await this.unlockForJettons();
        }
      } else {
        if (this.token === "ton") {
          throw new Error('can never happen');
        } else {
          await this.mintJetton();
        }
      }
    },
    onTokenChange(newValue: string) {
      clearInterval(
        this.updateStateIntervalForTon as ReturnType<typeof setInterval>
      );
      clearInterval(
        this.updateStateIntervalForJettons as ReturnType<typeof setInterval>
      );

      if (newValue === "ton") {
        this.updateStateForTon();
        this.updateStateIntervalForTon = setInterval(
          this.updateStateForTon,
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

    async checkApprove(amount: BN) {
      if (!this.isFromTon && this.token !== "ton" && this.tokenAddress) {
        console.log("checkApprove");
        const erc20Contract = new ERC20Contract(this.provider);
        if (Web3.utils.isAddress(this.tokenAddress)) {
          const userErcBalance = await erc20Contract.allowance({
            address: this.tokenAddress,
            spender: this.params.tonBridgeV2EVMAddress,
            owner: this.provider.myAddress,
          });
          if (amount.gt(new BN(userErcBalance.toString()))) {
            this.hasApprove = false;
          } else {
            this.hasApprove = true;
            console.log("this.hasApprove", this.hasApprove);
          }
        } else {
          this.hasApprove = false;
        }
      }
    },

    async approve() {
      this.isApprovingInProgress = true;
      const erc20Contract = new ERC20Contract(this.provider);

      const amount = MaxInt256.toString();
      try {
        const tx = await erc20Contract.approve({
          address: this.tokenAddress,
          spender: this.params.tonBridgeV2EVMAddress,
          amount,
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

    getOraclesText(oraclesStep: number): string {
      if (this.state.step === oraclesStep) {
        const providerData =
            this.token === "ton"
                ? this.providerDataForTon
                : this.providerDataForJettons;

        const votesConfirmations =
            (this.state.votes?.length || 0) +
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
      if (this.state.step === getCoinsStep) {
        return this.state.toCurrencySent
            ? this.$t(`networks.${this.pair}.transactionWait`)
            : this.$t("getCoinsByProvider", {
              provider: this.token === 'ton' ? this.provider.title : 'TON Wallet',
              toCoin: this.toCoin,
            });
      } else if (this.state.step > getCoinsStep) {
        return this.$t("coinsSent", { toCoin: this.toCoin });
      } else {
        const pair = this.isFromTon ? this.pair : "ton";
        return this.$t("getCoins", {
          toCoin: this.toCoin,
          toNetwork: this.$t(`networks.${pair}.${this.netTypeName}.name`),
        });
      }
    },

    generateQRCode() {
      this.isQRCodeShown = true;

      const url = PARAMS.tonTransferUrl
        .replace("<BRIDGE_ADDRESS>", this.params.tonBridgeAddress)
        .replace("<AMOUNT>", this.amount.toString())
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
    resetState() {
      this.state.swapId = "";
      this.state.queryId = "0";
      this.state.jettonEvmAddress = "";
      this.state.fromCurrencySent = false;
      this.state.toCurrencySent = false;
      this.state.step = 0;
      this.state.votes = null;
      this.state.swapData = null;
      this.state.burnData = null;
      this.state.createTime = 0;
      this.state.blockNumber = 0;

      this.isQRCodeShown = false;

      this.$emit("reset-state");
    },
    async loadState({ processingState }: any): Promise<boolean> {
      if (!processingState) {
        return false;
      }

      this.isInitInProgress = true;

      if (
        (processingState as any).token === "ton" &&
        !this.providerDataForTon
      ) {
        this.providerDataForTon = await this.initProviderForTON();
      } else if (!this.providerDataForJettons) {
        this.providerDataForJettons = await this.initProviderForJettons();
      }

      this.isInitInProgress = false;

      if (!this.providerDataForTon && !this.providerDataForJettons) {
        return false;
      }
      Object.assign(this.state, processingState);
      this.ethToTon = processingState.ethToTon;

      if ((processingState as any).token === "ton") {
        this.updateStateForTon();
      } else {
        this.updateStateForJettons();
      }

      return true;
    },
    saveState() {
      this.$emit("save-state", {
        ...this.state,
        isFromTon: this.isFromTon,
        token: this.token,
        tokenAddress: this.tokenAddress,
        ethToTon: this.ethToTon,
      });
    },
    deleteState() {
      this.$emit("delete-state");
    },
    async updateStateForTon() {
      if (this.state.step === 1 && this.isFromTon) {
        const swap = await this.getSwapForTON(
          this.amount,
          this.toAddress,
          this.state.createTime
        );
        if (swap) {
          this.state.swapId = this.getSwapTonToEthIdForTon(swap);
          this.state.swapData = swap;
          this.state.step = 3;
        }
      }

      if (this.state.step === 2 && !this.isFromTon) {
        const blockNumber = await this.provider.web3!.eth.getBlockNumber();
        this.providerDataForTon!.blockNumber = blockNumber;

        console.log(
          this.providerDataForTon?.blockNumber,
          this.state.blockNumber
        );
        const blocksConfirmations =
          (this.providerDataForTon?.blockNumber || this.state.blockNumber) -
          this.state.blockNumber;

        if (blocksConfirmations > this.params.blocksConfirmations) {
          const receipt = await this.provider.web3!.eth.getTransactionReceipt(
              this.ethToTon!.transactionHash
          );
          this.ethToTon!.blockNumber = receipt.blockNumber;
          const block = await this.provider.web3!.eth.getBlock(
              receipt.blockNumber
          );
          this.ethToTon!.blockTime = Number(block.timestamp);
          this.ethToTon!.blockHash = block.hash;
          const log = ToncoinBridge.findLog(this.provider.web3!, this.ethToTon!.from, this.ethToTon!.value, this.ethToTon!.to.workchain.toString(), this.ethToTon!.to.address_hash, receipt.logs);
          if (!log) throw new Error('cant find log');
          this.ethToTon!.logIndex = log.logIndex;

          this.state.queryId = this.getQueryId(this.ethToTon!).toString();
          this.state.step = 3;
        }
      }

      if (this.state.step === 3) {
        this.state.votes = this.isFromTon
          ? await this.getEthVoteForTON(this.state.swapId)
          : await this.getTonVoteForTON(this.state.queryId);
        if (
          this.state.votes &&
          this.state.votes!.length >=
            (this.providerDataForTon!.oraclesTotal * 2) / 3
        ) {
          this.state.step = this.isFromTon ? 4 : 5;
          if (this.isFromTon) {
            this.$emit("ready-to-mint");
          }
        }
      }
    },
    async updateStateForJettons() {
      if (this.state.step === 1 && this.isFromTon) {
        await this.getSwapForJettons(this.toAddress, this.state.createTime);
      }

      if (this.state.step === 2 && !this.isFromTon) {
        const blockNumber = await this.provider.web3!.eth.getBlockNumber();
        this.providerDataForJettons!.blockNumber = blockNumber;

        console.log(
          this.providerDataForJettons?.blockNumber,
          this.state.blockNumber
        );
        const blocksConfirmations =
          (this.providerDataForJettons?.blockNumber || this.state.blockNumber) -
          this.state.blockNumber;

        if (blocksConfirmations > this.params.blocksConfirmations) {
          const receipt = await this.provider.web3!.eth.getTransactionReceipt(
              this.ethToTon!.transactionHash
          );
          this.ethToTon!.blockNumber = receipt.blockNumber;
          const block = await this.provider.web3!.eth.getBlock(
            receipt.blockNumber
          );

          this.ethToTon!.blockTime = Number(block.timestamp);
          this.ethToTon!.blockHash = block.hash;

          const log = TokenBridge.findLog(this.provider.web3!, this.ethToTon!.from, this.ethToTon!.value, this.ethToTon!.to.address_hash, this.tokenAddress.toLowerCase(), receipt.logs);
          if (!log) throw new Error('cant find log');
          this.ethToTon!.logIndex = log.logIndex;

          this.state.queryId = this.getQueryId(this.ethToTon!).toString();
          this.state.step = 3;
        }
      }

      if (this.state.step === 3) {
        if (this.token !== 'ton' && !this.isFromTon) {
          const isPaid = await this.isJettonMintPaid(this.state.queryId);
          console.log('isPaid', this.state.queryId, isPaid);
          if (isPaid) {
            this.state.step = 4;
          }
        } else {
          this.state.votes = this.isFromTon
              ? await this.getEthVoteForJettons(this.state.swapId)
              : await this.getTonVoteForJettons(this.state.queryId);
          if (
              this.state.votes &&
              this.state.votes!.length >=
              (this.providerDataForJettons!.oraclesTotal * 2) / 3
          ) {
            this.state.step = 4;
            this.$emit("ready-to-mint");
          }
        }
      }

      if (this.state.step === 4) {
        if (this.token !== 'ton' && !this.isFromTon) {
          this.state.votes = await this.getTonVoteForJettons(this.state.queryId);
          if (
              this.state.votes &&
              this.state.votes!.length >=
              (this.providerDataForJettons!.oraclesTotal * 2) / 3
          ) {
            this.state.step = 5;
          }
        }
      }
    },
    getSwapTonToEthIdForTon(d: SwapTonToEth): string {
      const target = this.pair === "eth" && !this.isTestnet ? undefined : this.params.wTonAddress;
      return ToncoinBridge.getDataId(this.provider.web3!, d, target)
    },
    getSwapTonToEthIdForJettons(d: BurnEvent): string {
      return TokenBridge.getDataId(this.provider.web3!, d, this.params.tonBridgeV2EVMAddress, this.params.chainId);
    },

    getFeeAmountForTon(amount: BN): BN {
      const rest = amount.sub(this.providerDataForTon!.feeFlat);
      const percentFee = rest
        .mul(this.providerDataForTon!.feeFactor)
        .div(this.providerDataForTon!.feeBase);
      return this.providerDataForTon!.feeFlat.add(percentFee);
    },

    async getSwapForTON(
      myAmount: BN,
      myToAddress: string,
      myCreateTime: number
    ): Promise<null | SwapTonToEth> {
      console.log(
        "getTransactions",
        this.params.tonBridgeAddress,
        this.lt && this.hash ? 1 : this.isRecover ? 200 : 40,
        this.lt || undefined,
        this.hash || undefined,
        undefined,
        this.lt && this.hash ? true : undefined
      );
      const transactions =
        await this.providerDataForTon!.tonweb.provider.getTransactions(
          this.params.tonBridgeAddress,
          this.lt && this.hash ? 1 : this.isRecover ? 200 : 40,
          this.lt || undefined,
          this.hash || undefined,
          undefined,
          this.lt && this.hash ? true : undefined
        );
      console.log("ton txs", transactions.length);


      for (const t of transactions) {
        if (!this.isRecover && !(this.lt && this.hash)) {
          if (t.utime * 1000 < myCreateTime) continue;
        }

        const event = ToncoinBridge.processTonTransaction(t);

        if (event) {

          console.log(JSON.stringify(event));

          const amountAfterFee = myAmount.sub(this.getFeeAmountForTon(myAmount));

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
      const transactions: any[] =
          await this.providerDataForJettons!.tonweb.provider.getTransactions(
              this.params.tonBridgeAddressV2,
              40,
          );

      console.log("ton txs", transactions.length);

      for (const t of transactions) {
        const event = TokenBridge.processPayJettonMintTransaction(t);
        console.log(event);
        if (event && event.queryId === queryId) {
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
      console.log(
        "getTransactions",
        this.params.tonBridgeAddressV2,
        this.lt && this.hash ? 1 : this.isRecover ? 200 : 40,
        this.lt || undefined,
        this.hash || undefined,
        undefined,
        this.lt && this.hash ? true : undefined
      );
      const transactions: any[] =
        await this.providerDataForJettons!.tonweb.provider.getTransactions(
          this.params.tonBridgeAddressV2,
          this.lt && this.hash ? 1 : this.isRecover ? 200 : 40,
          this.lt || undefined,
          this.hash || undefined,
          undefined,
          this.lt && this.hash ? true : undefined
        );
      console.log("ton txs", transactions.length);

      for (const t of transactions) {
        if (!this.isRecover && !(this.lt && this.hash)) {
          if (t.utime * 1000 < myCreateTime) continue;
        }

        const event = TokenBridge.processTonTransaction(t);

        if (event) {

          console.log(JSON.stringify(event));

          if (
            event.ethReceiver.toLowerCase() === myToAddress.toLowerCase() &&
            this.state.jettonEvmAddress.toLocaleLowerCase() ===
              event.token.toLocaleLowerCase()
          ) {
            if (event) {
              const swapId = this.getSwapTonToEthIdForJettons(event);
              let isVotingFinished = true;
              try {
                isVotingFinished =
                  await this.providerDataForJettons!.bridgeContract.methods.finishedVotings(
                    swapId
                  ).call();
              } catch (error) {
                console.error(error);
                return null;
              }
              if (!isVotingFinished) {
                this.state.swapId = this.getSwapTonToEthIdForJettons(event);
                this.state.burnData = event;
                this.state.step = 3;
              }
            }
            return null;
          }
        }
      }
      return null;
    },
    async getEthVoteForTON(voteId: string): Promise<null | EvmSignature[]> {
      const result = await getEvmSignaturesFromCollector(this.providerDataForTon!.tonweb as any, this.params.tonCollectorAddress, voteId);
      return result ? result.signatures : null;
    },
    async getEthVoteForJettons(voteId: string): Promise<null | EvmSignature[]> {
      const result = await getEvmSignaturesFromCollector(this.providerDataForJettons!.tonweb as any, this.params.tonCollectorAddressV2, voteId);
      return result ? result.signatures : null;
    },
    async getTonVoteForTON(queryId: string): Promise<null | number[]> {
      return getVotesInMultisig(this.providerDataForTon!.tonweb as any, this.params.tonMultisigAddress, queryId, this.providerDataForTon!.oraclesTotal);
    },
    async getTonVoteForJettons(queryId: string): Promise<null | number[]> {
      return getVotesInMultisig(this.providerDataForJettons!.tonweb as any, this.params.tonMultisigAddressV2, queryId, this.providerDataForJettons!.oraclesTotal);
    },
    onDoneClick() {
      this.deleteState();
      this.resetState();
    },
    onCancelClick() {
      this.deleteState();
      this.resetState();
    },
    async checkProviderIsReady(): Promise<boolean> {
      try {
        if (!this.provider.isConnected) {
          const error = this.$t("errors.providerIsDisconnected", {
            provider: this.provider.title,
          });
          throw new Error(error);
        }

        if (!this.provider.myAddress) {
          throw new Error(this.$t("errors.cantGetAddress"));
        }

        if (this.provider.chainId !== this.params.chainId) {
          const error = this.$t("errors.wrongProviderNetwork", {
            network: this.$t(`networks.${this.pair}.${this.netTypeName}.name`),
            provider: this.provider.title,
          });
          throw new Error(error);
        }

        if (
          !new BN(
            await this.provider.web3!.eth.getBalance(this.provider.myAddress)
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
    async mintForTon() {
      if (this.isMintingInProgress) {
        return;
      }

      const isProviderReady = await this.checkProviderIsReady();

      if (!isProviderReady) {
        this.$emit("mint-failed");
        return;
      }
      this.isMintingInProgress = true;

      let receipt;
      try {
        let signatures = (this.state.votes! as EvmSignature[]).map((v) => {
          return {
            signer: v.publicKey,
            signature: ethers.utils.joinSignature({ r: v.r, s: v.s, v: v.v }),
          };
        });

        signatures = signatures.sort((a, b) => {
          return new BN(a.signer.substr(2), 16).cmp(
            new BN(b.signer.substr(2), 16)
          );
        });

        receipt =
          await this.providerDataForTon!.wtonContract.methods.voteForMinting(
            this.state.swapData!,
            signatures
          )
            .send({ from: this.provider.myAddress })
            .on("transactionHash", () => {
              this.state.toCurrencySent = true;
              this.isMintingInProgress = false;
              this.deleteState();
            });
      } catch (e) {
        console.error(e);
        this.$emit("mint-failed");
        this.isMintingInProgress = false;
        return;
      }

      this.isMintingInProgress = false;

      if (receipt.status) {
        this.state.step = 5;
        this.deleteState();
        this.$emit("minted-successfully");
      } else {
        console.error("transaction fail", receipt);
        this.$emit("mint-failed");
      }
    },
    async unlockForJettons() {
      if (this.isMintingInProgress) {
        return;
      }

      const isProviderReady = await this.checkProviderIsReady();

      if (!isProviderReady) {
        this.$emit("mint-failed");
        return;
      }
      let signatures = (this.state.votes! as EvmSignature[]).map((v) => {
        return {
          signer: v.publicKey,
          signature: ethers.utils.joinSignature({ r: v.r, s: v.s, v: v.v }),
        };
      });

      signatures = signatures.sort((a, b) => {
        return new BN(a.signer.substr(2), 16).cmp(
          new BN(b.signer.substr(2), 16)
        );
      });

      this.isMintingInProgress = true;
      let receipt;

      try {
        if (!this.state.burnData) return;
        const bridgeContract = new BridgeContract(this.provider);
        receipt = await bridgeContract.unlock({
          bridgeAddress: this.params.tonBridgeV2EVMAddress,
          signatures,
          ...this.state.burnData
        });
        receipt = await receipt.wait();
        this.state.fromCurrencySent = true;
        this.isMintingInProgress = false;
        if (receipt.status) {
          this.state.step = 5;
          this.deleteState();
          this.$emit("minted-successfully");
          this.isMintingInProgress = false;
        } else {
          console.error("transaction fail", receipt);
          this.$emit("mint-failed");
          this.isMintingInProgress = false;
        }
      } catch (error) {
        this.isMintingInProgress = false;

        console.error(error);
      }
    },
    async burnForTON(): Promise<void> {
      const isProviderReady = await this.checkProviderIsReady();

      if (!isProviderReady) {
        return;
      }
      this.isBurningInProgress = true;
      const fromAddress = this.provider.myAddress;
      const toAddress = this.toAddress;

      const addressTon = new TonWeb.utils.Address(toAddress);
      const wc = addressTon.wc;
      const hashPart = TonWeb.utils.bytesToHex(addressTon.hashPart);

      let receipt;

      try {
        receipt = await this.providerDataForTon!.wtonContract.methods.burn(
          this.amount,
          {
            workchain: wc,
            address_hash: "0x" + hashPart,
          }
        )
          .send({ from: fromAddress })
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
          logIndex: receipt.events.SwapEthToTon.logIndex,
          blockNumber: receipt.blockNumber,
          blockTime: 0,
          blockHash: "",

          from: fromAddress,
          to: {
            workchain: wc,
            address_hash: hashPart,
          },
          value: this.amount.toString(),

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
    async lockToken(): Promise<void> {
      const isProviderReady = await this.checkProviderIsReady();

      if (!isProviderReady) {
        return;
      }
      this.isBurningInProgress = true;
      const fromAddress = this.provider.myAddress;
      const toAddress = this.toAddress;

      const addressTon = new TonWeb.utils.Address(toAddress);
      const wc = addressTon.wc;
      if (wc !== 0) throw new Error('Only basechain wallets supported');
      const hashPart = TonWeb.utils.bytesToHex(addressTon.hashPart);

      let receipt;
      let amountUnits: string;

      try {
        const erc20Contract = new ERC20Contract(this.provider);

        const decimals = await erc20Contract.decimals({
          address: this.tokenAddress,
        });

        amountUnits = parseUnits(this.amount.toString(), decimals).toString();

        const bridgeContract = new BridgeContract(this.provider);
        receipt = await bridgeContract.lock({
          address: this.params.tonBridgeV2EVMAddress,
          token: this.tokenAddress,
          amount: amountUnits,
          to_address_hash: "0x" + hashPart
        });
        receipt = await receipt.wait();

        this.state.fromCurrencySent = true;
      } catch (e) {
        this.isBurningInProgress = false;
        console.error(e);
        this.resetState();
        return;
      }

      if (receipt.status) {
        this.isBurningInProgress = false;

        console.log("receipt", receipt);

        this.state.blockNumber = receipt.blockNumber;

        const logIndex = receipt?.events?.find(
          (v: any) => v.event === "Lock"
        )?.logIndex;

        this.ethToTon = {
          type: 'SwapEthToTon',
          transactionHash: receipt.transactionHash,
          logIndex,
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

        this.state.step = 2;
      } else {
        console.error("transaction fail", receipt);
      }
    },
    async burnJetton() {
      if (!this.providerDataForJettons) return;
      try {
        this.isBurningInProgress = true;
        const wallets =
          (await this.providerDataForJettons.tonwebWallet.provider.send(
            "ton_requestWallets",
            []
          )) as any;

        const wallet = wallets[0];

        const userTonAddress = new TonWeb.Address(wallet.address);
        if (userTonAddress.wc !== 0) throw new Error('Only basechain wallets supported');

        const tokenAddress = this.tokenAddress;

        const jettonWalletAddress = await getJettonWalletAddress({
          tonweb: this.providerDataForJettons.tonweb,
          userTonAddress,
          tokenAddress,
        });

        const destinationAddress = new TonWeb.utils.BN(
          this.provider.myAddress.slice(2),
          16
        );
        const { decimals, tokenAddress: jettonEvmAddress } =
          await getWrappedTokenData(
            this.providerDataForJettons.tonweb,
            this.tokenAddress
          );

        const { balance } = await getJettonWalletData(
          this.providerDataForJettons.tonweb,
          jettonWalletAddress!.toString(true, true, true)
        );

        const jettonAmountWithDecimals = new BN(
          parseUnits(this.amount.toString(), decimals).toString()
        );

        if (!balance.gte(jettonAmountWithDecimals)) {
          this.$emit("error", {
            input: "amount",
            message: this.$t("errors.toncoinBalance", {
              coin: this.tokenSymbol,
              balance: (+formatUnits(balance.toString(), decimals)).toFixed(0),
            }),
          });
          this.isBurningInProgress = false;
          return;
        }

        this.state.jettonEvmAddress = jettonEvmAddress;

        this.state.step = 1;
        await burnJetton({
          tonwebWallet: this.providerDataForJettons.tonwebWallet,
          destinationAddress,
          userTonAddress,
          jettonWalletAddress,
          jettonAmountWithDecimals,
        });
        this.isBurningInProgress = false;
      } catch (error) {
        this.isBurningInProgress = false;

        console.error(error);
        this.resetState();
      }
    },
    async mintJetton() {
      if (!this.providerDataForJettons) return;
      try {
        this.isBurningInProgress = true;
        const wallets =
            (await this.providerDataForJettons.tonwebWallet.provider.send(
                "ton_requestWallets",
                []
            )) as any;

        const wallet = wallets[0];

        const userTonAddress = new TonWeb.Address(wallet.address);
        if (userTonAddress.wc !== 0) throw new Error('Only basechain wallets supported');

        await mintJetton({
          tonwebWallet: this.providerDataForJettons.tonwebWallet,
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
    async initProviderForTON(): Promise<ProviderDataForTON | null> {
      const isProviderReady = await this.checkProviderIsReady();

      if (!isProviderReady) {
        return null;
      }

      const wtonContract = new this.provider.web3!.eth.Contract(
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

      const feeFlat = new BN(bridgeData[4][1].slice(2), 16);
      const feeNetwork = new BN(bridgeData[5][1].slice(2), 16);
      const feeFactor = new BN(bridgeData[6][1].slice(2), 16);
      const feeBase = new BN(bridgeData[7][1].slice(2), 16);

      const res: ProviderDataForTON = {
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
    async initProviderForJettons(): Promise<ProviderDataForJettons | null> {
      const isProviderReady = await this.checkProviderIsReady();

      if (!isProviderReady) {
        return null;
      }

      const tonWalletProvider = (window as any).ton;

      if (!tonWalletProvider.isTonWallet) {
        console.error("isTonWallet=", tonWalletProvider.isTonWallet);
        return null;
      }

      const tonwebWallet = new TonWeb(tonWalletProvider);

      const bridgeContract = new this.provider.web3!.eth.Contract(
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

      const res: ProviderDataForJettons = {
        blockNumber: 0,
        bridgeContract,
        tonweb,
        tonwebWallet,
        oraclesTotal,
      };

      return res;
    },
    async onTransferClick(): Promise<void> {
      if (this.isInitInProgress) {
        return;
      }

      this.isInitInProgress = true;

      if (!this.isInputsValid) {
        this.isInitInProgress = false;
        return;
      }

      if (this.token === "ton" && !this.providerDataForTon) {
        this.providerDataForTon = await this.initProviderForTON();
      } else if (!this.providerDataForJettons) {
        this.providerDataForJettons = await this.initProviderForJettons();
      }

      if (!(this.providerDataForTon || this.providerDataForJettons)) {
        this.isInitInProgress = false;
        return;
      }

      if (this.token === "ton" && this.providerDataForTon) {
        if (!this.isFromTon) {
          const userErcBalance = new BN(
            await this.providerDataForTon.wtonContract.methods
              .balanceOf(this.provider.myAddress)
              .call()
          );
          if (this.amount.gt(userErcBalance)) {
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
        }
        this.isInitInProgress = false;

        this.state.createTime = Date.now();
        this.state.step = 1;

        if (this.isFromTon) {
          this.saveState();
        } else {
          await this.burnForTON();
        }
      } else if (this.providerDataForJettons) {
        this.isInitInProgress = false;
        if (!this.isFromTon) {
          this.isLockingInProgress = true;

          const erc20Contract = new ERC20Contract(this.provider);
          const decimals = await erc20Contract.decimals({
            address: this.tokenAddress,
          });
          const balance = new BN(
            (
              await erc20Contract.balanceOf({
                address: this.tokenAddress,
                account: this.provider.myAddress,
              })
            ).toString()
          );
          const tokenAmountWithDecimals = new BN(
            parseUnits(this.amount.toString(), decimals).toString()
          );
          if (!balance.gte(tokenAmountWithDecimals)) {
            this.$emit("error", {
              input: "amount",
              message: this.$t("errors.toncoinBalance", {
                coin: this.tokenSymbol,
                balance: (+formatUnits(balance.toString(), decimals)).toFixed(
                  0
                ),
              }),
            });
            this.isLockingInProgress = false;
            return;
          }

          await this.lockToken();
          this.isLockingInProgress = false;
          this.saveState();
        } else {
          this.isInitInProgress = false;

          await this.burnJetton();
        }
      }
    },
  },
});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
