import {EthereumProvider} from "@walletconnect/ethereum-provider";
import {createNanoEvents, Emitter} from "nanoevents";
import Web3 from "web3";
import {parseChainId} from "@/utils/helpers";

import {Provider} from "../provider";
import {Web3Provider} from "@ethersproject/providers";

interface Events {
  disconnect: () => void;
}

export class WalletConnect implements Provider {
  public name = "walletConnect";
  public title = "WalletConnect";
  public web3: Web3 | null = null;
  public myAddress = "";
  public chainId = 0;
  public isConnected = false;
  private walletConnect?: any;
  public provider?: Web3Provider;
  private emitter: Emitter;

  constructor() {
    this.emitter = createNanoEvents<Events>();
    this.onAccountsChanged = this.onAccountsChanged.bind(this);
    this.onChainChanged = this.onChainChanged.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);
    this.onConnect = this.onConnect.bind(this);
  }

  on<E extends keyof Events>(event: E, callback: Events[E]) {
    return this.emitter.on(event, callback);
  }

  async connect(params: ParamsNetwork): Promise<boolean> {
    this.walletConnect = await EthereumProvider.init({
      projectId: '94099fc4aa88338ac0e67f25b47da521',
      chains: [1, 56],
      showQrModal: true,
      rpcMap: {
        '1' : 'https://bridge.ton.org/mainnet/',
        '56': 'https://bsc-dataseed.binance.org/'
      }
    });

    this.walletConnect!.on("connect", this.onConnect);

    try {
      await this.walletConnect!.enable();
    } catch (e: any) {
      if (e.message === "User closed modal") {
        // soft error: User rejected the request.
        console.log(e.message);
        return false;
      }
      throw new Error(e.message);
    }

    this.web3 = new Web3(this.walletConnect!);

    const accounts = await this.web3.eth.getAccounts();
    this.myAddress = accounts[0];

    this.chainId = parseChainId(await this.web3.eth.net.getId());

    // if (this.chainId !== params.chainId) {
    //     this.disconnect();
    //     throw new Error('errors.invalidChain')
    // }

    this.provider = new Web3Provider(this.web3.currentProvider! as any);

    this.isConnected = true;

    this.walletConnect!.on("accountsChanged", this.onAccountsChanged);
    this.walletConnect!.on("chainChanged", this.onChainChanged);
    this.walletConnect!.on("disconnect", this.onDisconnect);

    return true;
  }

  onAccountsChanged(accounts: Array<string>) {
    console.log("account changed, old address: ", this.myAddress);
    if (accounts && accounts.length) {
      this.myAddress = accounts[0];
    } else {
      this.myAddress = "";
    }
    console.log("account changed, new address: ", this.myAddress);

    this.onDisconnect(0, "");
  }

  onChainChanged(chainId: number | string) {
    console.log("chain changed, old chain: ", this.chainId);
    this.chainId = parseChainId(chainId);
    console.log("chain changed, new chain: ", this.chainId);
  }

  removeListeners() {
    this.walletConnect!.off("accountsChanged", this.onAccountsChanged);
    this.walletConnect!.off("chainChanged", this.onChainChanged);
    this.walletConnect!.off("disconnect", this.onDisconnect);
    this.walletConnect!.off("connect", this.onConnect);
  }

  onDisconnect(code: number, reason: string) {
    this.isConnected = false;
    console.log("disconnected");

    this.removeListeners();

    this.emitter.emit("disconnect");
    this.emitter.events = {};
  }

  onConnect(connectInfo: any) {
    this.isConnected = true;
    console.log("connected");
  }

  async switchChain(chainId: number): Promise<boolean> {
    try {
      await this.walletConnect.switchEthereumChain(chainId);
    } catch (e) {
      console.error(e);
      return false;
    }
    // `this.chainId` will set be set on `onChainChanged`
    return true;
  }

  disconnect() {
    this.walletConnect!.disconnect();
    this.onDisconnect(0, '');
  }
}
