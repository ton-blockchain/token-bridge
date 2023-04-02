import BN from "bn.js";
import TonWeb from "tonweb";
import { Contract } from "web3-eth-contract";
import {SwapEthToTonEvent, SwapTonToEth} from "@/ton-bridge-lib/ToncoinBridge";
import {EvmSignature} from "@/ton-bridge-lib/BridgeCollector";
import {BurnEvent} from "@/ton-bridge-lib/TokenBridge";

type ProviderDataForToncoin = {
  oraclesTotal: number;
  blockNumber: number;
  wtonContract: Contract;
  tonweb: TonWeb;
  feeFlat: BN;
  feeFactor: BN;
  feeBase: BN;
};

type ProviderDataForJettons = {
  oraclesTotal: number;
  blockNumber: number;
  bridgeContract: Contract;
  tonweb: TonWeb;
  myAddress: string;
  tonWallet: any; // TON Extension
};

type State = {
  swapId: string;
  queryId: string;
  jettonEvmAddress: string;
  fromCurrencySent: boolean;
  toCurrencySent: boolean;
  step: number;
  votes: EvmSignature[] | number[] | null;
  swapData: SwapTonToEth | null;
  burnData: BurnEvent | null;
  createTime: number;
  blockNumber: number;
};

type ComponentData = {
  updateStateIntervalForToncoin: null | ReturnType<typeof setInterval>;
  updateStateIntervalForJettons: null | ReturnType<typeof setInterval>;
  providerDataForToncoin: ProviderDataForToncoin | null;
  providerDataForJettons: ProviderDataForJettons | null;
  state: State;
  ethToTon: SwapEthToTonEvent | null;
  isInitInProgress: boolean;
  isMintingInProgress: boolean;
  isApprovingInProgress: boolean;
  isGetAllowanceInProcess: boolean;
  isGetAllowanceError: boolean;
  isBurningInProgress: boolean;
  isLockingInProgress: boolean;
  isQRCodeShown: boolean;
  hasApprove: boolean;
};

export {
  ComponentData,
  ProviderDataForJettons,
  ProviderDataForToncoin,
  State,
};
