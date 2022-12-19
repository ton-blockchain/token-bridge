function getScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script: HTMLScriptElement = document.createElement("script");
    const prior = document.getElementsByTagName("script")[0];
    script.async = true;

    script.onload = () => {
      script.onload = null;
      script.onerror = null;
      setTimeout(resolve, 0);
    };

    script.onerror = () => {
      script.onload = null;
      script.onerror = null;
      setTimeout(reject, 0);
    };

    script.src = src;
    prior.parentNode!.insertBefore(script, prior);
  });
}

function supportsLocalStorage(): boolean {
  try {
    return "localStorage" in window && window["localStorage"] !== null;
  } catch (e) {
    return false;
  }
}

function parseChainId(chainId: string | number): number {
  if (typeof chainId === "number") {
    return chainId;
  }
  if (typeof chainId === "string") {
    return parseInt(chainId, chainId.toLowerCase().startsWith("0x") ? 16 : 10);
  } else {
    return 0;
  }
}

export {
  getScript,
  parseChainId,
  supportsLocalStorage
};
