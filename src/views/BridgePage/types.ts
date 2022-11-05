import { Provider } from "@/utils/providers/provider";

type ComponentData = {
  getPairGasFee__debounced: () => void;
  gasPrice: number;

  isTestnet: boolean;
  isRecover: boolean;
  lt: number;
  hash: string;

  tokenSymbol: string;

  isFromTon: boolean;
  pair: string;
  token: string;
  amountInput: string;
  toAddress: string;
  tokenAddress: string;
  provider: Provider | null;

  isTransferInProgress: boolean;
  isConnected: boolean;
  walletsPopupState: string;
  bridgeProcessorIsLoading: boolean;
  history: {
    address: string;
    network: string;
    isShown: boolean;
  };
  mainPageFixedPosition: number;
  errors: {
    amount: string;
    toAddress: string;
    tokenAddress: string;
  };
};

export { ComponentData };
