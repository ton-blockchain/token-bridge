import BN from "bn.js";
import TonWeb from "tonweb";
import { Contract } from "web3-eth-contract";

type EthToTon = {
  transactionHash: string;
  logIndex: number;
  to: {
    workchain: number;
    address_hash: string;
  };
  value: BN;
  blockTime: number;
  blockHash: string;
  from: string;
};

type SwapData = {
  receiver: string;
  amount: string;
  tx: {
    address_: {
      workchain: number;
      address_hash: string;
    };
    tx_hash: string;
    lt: number;
  };
};

type BurnData = {
  receiver: string; // address
  token: string;
  amount: string; // uint64
  tx: {
    address_hash: string;
    tx_hash: string;
    lt: number;
  };
};

type VoteEth = {
  publicKey: string;
  r: string;
  s: string;
  v: number | undefined;
};

type ProviderDataForTON = {
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
  tonwebWallet: TonWeb;
};

type State = {
  swapId: string;
  queryId: string;
  jettonEvmAddress: string;
  fromCurrencySent: boolean;
  toCurrencySent: boolean;
  step: number;
  votes: VoteEth[] | number[] | null;
  swapData: SwapData | null;
  burnData: BurnData | null;
  createTime: number;
  blockNumber: number;
};

type ComponentData = {
  updateStateIntervalForTon: null | ReturnType<typeof setInterval>;
  updateStateIntervalForJettons: null | ReturnType<typeof setInterval>;
  providerDataForTon: ProviderDataForTON | null;
  providerDataForJettons: ProviderDataForJettons | null;
  state: State;
  ethToTon: EthToTon | null;
  isInitInProgress: boolean;
  isMintingInProgress: boolean;
  isApprovingInProgress: boolean;
  isBurningInProgress: boolean;
  isLockingInProgress: boolean;
  isQRCodeShown: boolean;
  hasApprove: boolean;
};

export {
  BurnData,
  ComponentData,
  EthToTon,
  ProviderDataForJettons,
  ProviderDataForTON,
  State,
  SwapData,
  VoteEth,
};
