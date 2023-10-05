import { FALLBACK_PROVIDERS, getFallbackRpcUrl, getRpcUrl } from "config/chains";
import { Signer, ethers } from "ethers";

export function getProvider(signer: Signer | undefined, chainId: number) {
  let provider;

  if (signer) {
    return signer;
  }

  provider = getRpcUrl(chainId);

  return new ethers.providers.StaticJsonRpcProvider(
    provider,
    // @ts-ignore incorrect Network param types
    { chainId }
  );
}

export function getFallbackProvider(chainId: number) {
  if (!FALLBACK_PROVIDERS[chainId]) {
    return;
  }

  const provider = getFallbackRpcUrl(chainId);

  return new ethers.providers.StaticJsonRpcProvider(
    provider,
    // @ts-ignore incorrect Network param types
    { chainId }
  );
}
