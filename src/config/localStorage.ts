export const REDIRECT_POPUP_TIMESTAMP_KEY = "redirect-popup-timestamp";
export const LANGUAGE_LOCALSTORAGE_KEY = "LANGUAGE_KEY";
export const REFERRAL_CODE_KEY = "GMX-referralCode";
export const PRODUCTION_PREVIEW_KEY = "production-preview";
export const getSubgraphUrlKey = (chainId: number, subgraph: string) => `subgraphUrl:${chainId}:${subgraph}`;
