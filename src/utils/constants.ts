export const PARAMS: Params = {
  appName: "TON Bridge",
  appLogoUrl: "https://ton.org/bridge/favicon.ico",
  tonTransferUrl:
    "ton://transfer/<BRIDGE_ADDRESS>?amount=<AMOUNT>&text=swapTo%23<TO_ADDRESS>",
  tonExplorerUrl: {
    main: "https://tonscan.org/address/<ADDRESS>",
    test: "https://tonscan.org/address/<ADDRESS>",
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
        tonBridgeAddressV2: "",
        tonBridgeV2EVMAddress: "",
        tonCollectorAddressV2: "",
        tonMultisigAddressV2: "",
        tonCenterUrl: "https://wallet.toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey: "",
        rpcEndpoint:
          "https://mainnet.infura.io/v3/d29ee9db9b7b4bbc8fa5d28047a3ff47",
        chainId: 1,
        blocksConfirmations: 12,
        defaultGwei: 25,
        coinsPerGweiTo: 0.004,
        coinsPerGweiFrom: 0.001,
      },
      test: {
        getGasUrl: "https://ethereumgas.toncenter.com",
        explorerUrl: "https://rinkeby.etherscan.io/token/<ADDRESS>",
        wTonAddress: "0x2968721bF293BAa3A91503DCc9853954FaF19b48",
        tonBridgeAddress: "Uf/SoN57VskmwQGVKybKMZg2IgjF9u70tOGpwBB5t/oEjisw",
        tonCollectorAddress: "Uf/TePiQBYXpZIhG/1qp2KDakFXvOojsqkcfHr2s2VykU4Gw",
        tonMultisigAddress: "Uf/oakB9qww5xc4v5mAA6V9fNjwt/p1IzpVBvqDctzK7ll5w",
        tonBridgeV2EVMAddress: "0x4E1edf0df291308e127F42af57E95519BDd78412",
        tonBridgeAddressV2: "Ef8KQJu6icsG2p9kEmWvjr7OfXZriklfH07r0Bome7-oj6bq",
        tonCollectorAddressV2:
          "Ef8XgFexQROKv4NSFzV-KC0fb_pFZqkPDgFXHF32WEuniiaC",
        tonMultisigAddressV2:
          "Ef_J6OpV-tAdJjby1fvE6oD2-Put6VL4fuFn-g4qDVQDXPAi",
        tonCenterUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "7af9a174f418944c718347b6e0937aed5a3d72b92fd2d7746a05c3da15667b9f",
        rpcEndpoint:
          "https://rinkeby.infura.io/v3/1f24ea6b55e9432d993a9c0ff68eeee5",
        chainId: 4,
        blocksConfirmations: 12,
        defaultGwei: 25,
        coinsPerGweiTo: 0.004,
        coinsPerGweiFrom: 0.001,
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
        tonCenterUrl: "https://wallet.toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey: "",
        rpcEndpoint: "https://bsc-dataseed.binance.org/",
        chainId: 56,
        blocksConfirmations: 12,
        defaultGwei: 5,
        coinsPerGweiTo: 0.0008,
        coinsPerGweiFrom: 0.0002,
      },
      test: {
        getGasUrl:
          "https://gbsc.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle",
        explorerUrl: "https://testnet.bscscan.com/token/<ADDRESS>",
        wTonAddress: "0x278e8F657070Cbf97779608Fb1F37964091a19cF",
        tonBridgeAddress: "Uf+MfJJlkjBjsPiW7wH/6F0mrUgU7D1j6ciyZCcFsqF3TW9E",
        tonCollectorAddress: "Ef_sDJFMO8YCxhCH6cYymz4xit6yCCrrjhlItxLt_Ico7da9",
        tonMultisigAddress: "Ef9HDJQ5bbwUhDV3FOpDuLqwQf27AGc2eoJMXMEGQ2kMah8G",
        tonBridgeV2EVMAddress: "0x8E2D0A5ec1F139Df98De28F520421191F41572e9",
        tonBridgeAddressV2: "Ef_pm4G662VWNKhFi_B8RfoGM8vbeYyzudPkJCdg1m1hRzBA",
        tonCollectorAddressV2:
          "Ef_sDJFMO8YCxhCH6cYymz4xit6yCCrrjhlItxLt_Ico7da9",
        tonMultisigAddressV2:
          "Ef-PRBrDlM-U0Ng6djQDZU14CdL1tn3xbxfsVO-BWpK2WWYY",
        tonCenterUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "7af9a174f418944c718347b6e0937aed5a3d72b92fd2d7746a05c3da15667b9f",
        rpcEndpoint: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        chainId: 97,
        blocksConfirmations: 12,
        defaultGwei: 5,
        coinsPerGweiTo: 0.0008,
        coinsPerGweiFrom: 0.0002,
      },
    },
  },
};
