import Web3 from "web3";

interface Events {
  disconnect: () => void;
}

export interface Provider {
  name: string;
  title: string;
  web3: Web3 | null;
  myAddress: string;
  chainId: number;
  isConnected: boolean;

  connect(params: any): Promise<boolean>;
  onAccountsChanged(accounts: Array<string>): void;
  onChainChanged(chainId: number | string): void;
  onDisconnect(code: number, reason: string): void;
  onConnect(connectInfo: any): void;
  switchChain(chainId: number): Promise<boolean>;
  disconnect(): void;
  on<E extends keyof Events>(event: E, callback: Events[E]): void;
}
