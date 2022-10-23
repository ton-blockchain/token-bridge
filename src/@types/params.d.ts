type ParamsNetwork = {
  getGasUrl: string;
  explorerUrl: string;
  wTonAddress: string;
  tonBridgeV2EVMAddress: string;
  tonBridgeAddress: string;
  tonCollectorAddress: string;
  tonMultisigAddress: string;
  tonBridgeAddressV2: string;
  tonCollectorAddressV2: string;
  tonMultisigAddressV2: string;
  tonCenterUrl: string;
  tonCenterApiKey: string;
  rpcEndpoint: string;
  chainId: number;
  blocksConfirmations: number;
  defaultGwei: number;
  coinsPerGweiTo: number;
  coinsPerGweiFrom: number;
};

type Params = {
  tonTransferUrl: string;
  tonExplorerUrl: {
    main: string;
    test: string;
  };
  appName: string;
  appLogoUrl: string;
  networks: {
    [key: string]: {
      main: ParamsNetwork;
      test: ParamsNetwork;
    };
  };
};
