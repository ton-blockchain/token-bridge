import TonWeb from "tonweb";

export const MINIMUM_TONCOIN_AMOUNT = TonWeb.utils.toNano('10');

export const PARAMS: Params = {
  appName: "TON Bridge",
  appLogoUrl: "https://ton.org/bridge/favicon.ico",
  tonTransferUrl:
    "ton://transfer/<BRIDGE_ADDRESS>?amount=<AMOUNT>&text=swapTo%23<TO_ADDRESS>",
  tonExplorerUrl: {
    main: "https://tonscan.org/address/<ADDRESS>",
    test: "https://testnet.tonscan.org/address/<ADDRESS>",
  },
  networks: {
    eth: {
      main: {
        getGasUrl: "https://ethereumgas.toncenter.com",
        explorerUrl: "https://etherscan.io/token/<ADDRESS>",
        wTonAddress: "0x582d872a1b094fc48f5de31d3b73f2d9be47def1",
        tonBridgeAddress: "Ef_dJMSh8riPi3BTUTtcxsWjG8RLKnLctNjAM4rw8NN-xWdr",
        tonCollectorAddress: "EQCuzvIOXLjH2tv35gY4tzhIvXCqZWDuK9kUhFGXKLImgxT5",
        tonMultisigAddress: "kf87m7_QrVM4uXAPCDM4DuF9Rj5Rwa5nHubwiQG96JmyAo-S",
        tonBridgeAddressV2: "Ef-1JetbPF9ubc1ga-57oHoOyDA1IShJt-BVlJnA9rrVTfrB",
        tonBridgeV2EVMAddress: "0xb323692b6d4DB96af1f52E4499a2bd0Ded9af3C5",
        tonCollectorAddressV2: "EQDF6fj6ydJJX_ArwxINjP-0H8zx982W4XgbkKzGvceUWvXl",
        tonMultisigAddressV2: "Ef8hHxV0v2I9FHh3CMX91WXjKaJav6SQlemEQm8ZvPBJdLde",
        tonCenterUrl: "https://toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "d843619b379084d133f061606beecbf72ae2bf60e0622e808f2a3f631673599b",
        rpcEndpoint:
          "https://mainnet.infura.io/v3/d29ee9db9b7b4bbc8fa5d28047a3ff47",
        chainId: 1,
        blocksConfirmations: 65,
        defaultGwei: 25,
        toncoinTransferTo_gasPrice: 0.004,
        toncoinTransferFrom_gasPrice: 0.001,
        tokenTransferTo_gasPrice: 0.00173,
        tokenTransferFrom_gasPrice: 0.0036,
      },
      test: {
        getGasUrl: "https://ethereumgas.toncenter.com",
        explorerUrl: "https://goerli.etherscan.io/token/<ADDRESS>",
        wTonAddress: "0xDB15ffaf2c88F2d89Db9365a5160D5b8c9448Ea6",
        tonBridgeAddress: "Ef-56ZiqKUbtp_Ax2Qg4Vwh7yXXJCO8cNJAb229J6XXe4-aC",
        tonCollectorAddress: "EQCA1W_I267-luVo9CzV7iCcrA1OO5vVeXD0QHACvBn1jIVU",
        tonMultisigAddress: "kf-OV1dpgFVEzEmyvAETT8gnhqZ1IqHn8RzT6dmEmvnze-9n",
        tonBridgeV2EVMAddress: "0x4Efd8f04B6fb4CFAF0cfaAC11Fb489b97DBebB60",
        tonBridgeAddressV2: "Ef-lJBALjXSSwSKiedKzriSHixwQUxJ1BxTE05Ur5AXwZVjp",
        tonCollectorAddressV2:
          "EQC1ZeKX1LNrlQ4bwi3je3KVM1AoZ3rkeyHM5hv9pYzmIh4v",
        tonMultisigAddressV2:
          "kf9NLH8CsGUkEKGYzCxaLd9Th6T5YkO-MXsCEU9Rw1fiRhf9",
        tonCenterUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "d843619b379084d133f061606beecbf72ae2bf60e0622e808f2a3f631673599b",
        rpcEndpoint:
          "https://goerli.infura.io/v3/1f24ea6b55e9432d993a9c0ff68eeee5",
        chainId: 5,
        blocksConfirmations: 12,
        defaultGwei: 25,
        toncoinTransferTo_gasPrice: 0.004,
        toncoinTransferFrom_gasPrice: 0.001,
        tokenTransferTo_gasPrice: 0.00173,
        tokenTransferFrom_gasPrice: 0.0036,
      },
    },
    bsc: {
      main: {
        getGasUrl:
          "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
        explorerUrl: "https://bscscan.com/token/<ADDRESS>",
        wTonAddress: "0x76A797A59Ba2C17726896976B7B3747BfD1d220f",
        tonBridgeAddress: "Ef9NXAIQs12t2qIZ-sRZ26D977H65Ol6DQeXc5_gUNaUys5r",
        tonCollectorAddress: "EQAHI1vGuw7d4WG-CtfDrWqEPNtmUuKjKFEFeJmZaqqfWTvW",
        tonMultisigAddress: "kf8OvX_5ynDgbp4iqJIvWudSEanWo0qAlOjhWHtga9u2Yo7j",
        tonBridgeV2EVMAddress: "",
        tonBridgeAddressV2: "",
        tonCollectorAddressV2: "",
        tonMultisigAddressV2: "",
        tonCenterUrl: "https://toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "d843619b379084d133f061606beecbf72ae2bf60e0622e808f2a3f631673599b",
        rpcEndpoint: "https://bsc-dataseed.binance.org/",
        chainId: 56,
        blocksConfirmations: 65,
        defaultGwei: 5,
        toncoinTransferTo_gasPrice: 0.0008,
        toncoinTransferFrom_gasPrice: 0.0002,
        tokenTransferTo_gasPrice: 0.0016,
        tokenTransferFrom_gasPrice: 0.0004,
      },
      test: {
        getGasUrl:
          "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
        explorerUrl: "https://testnet.bscscan.com/token/<ADDRESS>",
        wTonAddress: "0xdb15ffaf2c88f2d89db9365a5160d5b8c9448ea6",
        tonBridgeAddress: "Ef_GmJntTDokxfhLGF1jRvMGC8Jav2V5keoNj4El2jzhHsID",
        tonCollectorAddress: "EQDBNfV4DQzSyzNMw6BCTSZSoUi-CzWcYNsfhKxoDqfrwFtS",
        tonMultisigAddress: "kf83VnnXuaqQV1Ts2qvUr6agacM0ydOux5NNa1mcU-cEO693",
        tonBridgeV2EVMAddress: "0x501f187829Be89Fd84334aB402a99c626c8c7B65",
        tonBridgeAddressV2: "Ef-QhQLNRndggmLKXzFzA-F51rnjZ5yWY3ww2JjcHjEDohCg",
        tonCollectorAddressV2:
          "EQDTtD0leOd2aRtfX8sVwhdIpgoO1kvYj2iiBpbOMBgmi_I7",
        tonMultisigAddressV2:
          "kf8n7jRSwkvkKoqlt8YGyQ93IivUp52j6oIlleVsuKS2NYnr",
        tonCenterUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "52993043eb68ddd4dfee9f0f6a2a5d341226c7b5c77c4ae7758c158d6c7e00c4",
        rpcEndpoint: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        chainId: 97,
        blocksConfirmations: 12,
        defaultGwei: 5,
        toncoinTransferTo_gasPrice: 0.0008,
        toncoinTransferFrom_gasPrice: 0.0002,
        tokenTransferTo_gasPrice: 0.0016,
        tokenTransferFrom_gasPrice: 0.0004,
      },
    },
  },
};

export const getTokenAddressByToken = (token: string, isFromTon: boolean, isTestnet: boolean, pair: string): string => {
  if (isTestnet) { // TESTNET

    if (pair === 'eth') { // Goerli
      switch (token) {
        case 'usdt':
          return isFromTon ? 'EQCyOkdBxpGvZ1stp7uZQi25WXH3lPg3_-nZ6xEbxcJXeZvV' : '0x7120c3f1528e1356b2aac0bb6a0e5acb008cd9e5';
        case 'usdc':
          return isFromTon ? '' : '';
        case 'dai':
          return isFromTon ? '' : '';
        case 'wbtc':
          return isFromTon ? '' : '';
      }
    } else if (pair === 'bsc') { // BSC testnet
      switch (token) {
        case 'usdt':
          return isFromTon ? 'EQASJnz-JMQLwzH0qxohY0IK6jahBlTd63rtccA17G7tzL5t' : '0xe934b638b61d9c51bdb2cde62b8edae3a1f2064a';
        case 'usdc':
          return isFromTon ? '' : '';
        case 'dai':
          return isFromTon ? '' : '';
        case 'wbtc':
          return isFromTon ? '' : '';
      }
    }
    return '';

  } else { // MAINNET

    if (pair === 'eth') { // Ethereum Mainnet
      switch (token) {
        case 'usdt':
          return isFromTon ? 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA' : '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        case 'usdc':
          return isFromTon ? 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728' : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        case 'dai':
          return isFromTon ? 'EQDo_ZJyQ_YqBzBwbVpMmhbhIddKtRP99HugZJ14aFscxi7B' : '0x6B175474E89094C44Da98b954EedeAC495271d0F';
        case 'wbtc':
          return isFromTon ? 'EQDcBkGHmC4pTf34x3Gm05XvepO5w60DNxZ-XT4I6-UGG5L5' : '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
      }
    }
    return ''; // BSC Mainnet
  }
}