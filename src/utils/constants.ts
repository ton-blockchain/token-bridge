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
        tonBridgeAddressV2: "",
        tonBridgeV2EVMAddress: "",
        tonCollectorAddressV2: "",
        tonMultisigAddressV2: "",
        tonCenterUrl: "https://toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "d843619b379084d133f061606beecbf72ae2bf60e0622e808f2a3f631673599b",
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
        explorerUrl: "https://goerli.etherscan.io/token/<ADDRESS>",
        wTonAddress: "0xDB15ffaf2c88F2d89Db9365a5160D5b8c9448Ea6",
        tonBridgeAddress: "Ef-56ZiqKUbtp_Ax2Qg4Vwh7yXXJCO8cNJAb229J6XXe4-aC",
        tonCollectorAddress: "EQCA1W_I267-luVo9CzV7iCcrA1OO5vVeXD0QHACvBn1jIVU",
        tonMultisigAddress: "kf-OV1dpgFVEzEmyvAETT8gnhqZ1IqHn8RzT6dmEmvnze-9n",
        tonBridgeV2EVMAddress: "0x4E1edf0df291308e127F42af57E95519BDd78412",
        tonBridgeAddressV2: "Ef8KQJu6icsG2p9kEmWvjr7OfXZriklfH07r0Bome7-oj6bq",
        tonCollectorAddressV2:
          "Ef8XgFexQROKv4NSFzV-KC0fb_pFZqkPDgFXHF32WEuniiaC",
        tonMultisigAddressV2:
          "Ef_J6OpV-tAdJjby1fvE6oD2-Put6VL4fuFn-g4qDVQDXPAi",
        tonCenterUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "d843619b379084d133f061606beecbf72ae2bf60e0622e808f2a3f631673599b",
        rpcEndpoint:
          "https://goerli.infura.io/v3/1f24ea6b55e9432d993a9c0ff68eeee5",
        chainId: 5,
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
        tonCenterUrl: "https://toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "d843619b379084d133f061606beecbf72ae2bf60e0622e808f2a3f631673599b",
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
        wTonAddress: "0xdb15ffaf2c88f2d89db9365a5160d5b8c9448ea6",
        tonBridgeAddress: "Ef_GmJntTDokxfhLGF1jRvMGC8Jav2V5keoNj4El2jzhHsID",
        tonCollectorAddress: "EQDBNfV4DQzSyzNMw6BCTSZSoUi-CzWcYNsfhKxoDqfrwFtS",
        tonMultisigAddress: "kf83VnnXuaqQV1Ts2qvUr6agacM0ydOux5NNa1mcU-cEO693",
        tonBridgeV2EVMAddress: "0xA25805A3b25CBa417FCEa44d9A73c4f923415F5B",
        tonBridgeAddressV2: "Ef9wQwTpfH3zF6L1cNpRQF4bjJE0sqYRrt_JfrQbmeJn_Hh2",
        tonCollectorAddressV2:
          "EQDCJE2o5aX0U5YZslZYFChWsgZpRFVml_b9xQPmLmVPegPW",
        tonMultisigAddressV2:
          "kf8ghwmw3afnQwnGG4W99hMvMxqlkfUm2QtHXiux1ElPO4tG",
        tonCenterUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
        tonCenterApiKey:
          "d843619b379084d133f061606beecbf72ae2bf60e0622e808f2a3f631673599b",
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
