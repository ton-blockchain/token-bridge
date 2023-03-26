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
  ethereumProvider: Provider | null;

  isTransferInProgress: boolean;
  isEthereumWalletConnected: boolean;
  walletsPopupState: string;
  bridgeProcessorIsLoading: boolean;
  errors: {
    amount: string;
    toAddress: string;
    tokenAddress: string;
  };
};

export { ComponentData };
