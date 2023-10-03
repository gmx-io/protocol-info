import { useEffect, useState } from "react";
import { bigNumberify, expandDecimals } from "./numbers";
import { gql } from "@apollo/client";
import { getGmxGraphClient } from "./subgraph";
import { t } from "@lingui/macro";

export const REFERRAL_CODE_QUERY_PARAM = "ref";
export const USD_DECIMALS = 30;
export const PRECISION = expandDecimals(1, 30);

export function isLocal() {
  return window.location.host?.includes("localhost");
}

export function getAppBaseUrl() {
  if (isLocal()) {
    return "http://localhost:3011/#";
  }

  return "https://app.gmx.io/#";
}

export function getHomeUrl() {
  if (isLocal()) {
    return "http://localhost:3010";
  }

  return "https://gmx.io";
}

export function isValidTimestamp(timestamp: any) {
  return new Date(timestamp).getTime() > 0;
}

export function shouldShowRedirectModal(timestamp) {
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;
  const expiryTime = timestamp + thirtyDays;
  return !isValidTimestamp(timestamp) || Date.now() > expiryTime;
}

export function importImage(name) {
  let tokenImage = "";

  try {
    tokenImage = require("img/" + name);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  return tokenImage;
}

export function useUserStat(chainId) {
  const query = gql(`{
      userStat(id: "total") {
        id
        uniqueCount
      }
    }`);

  const [res, setRes] = useState<any>();

  useEffect(() => {
    // eslint-disable-next-line no-console
    getGmxGraphClient(chainId)?.query({ query }).then(setRes).catch(console.warn);
  }, [setRes, query, chainId]);

  return res ? res.data.userStat : null;
}

export function getTotalVolumeSum(volumes) {
  if (!volumes || volumes.length === 0) {
    return;
  }

  let volume = bigNumberify(0)!;

  for (let i = 0; i < volumes.length; i++) {
    volume = volume.add(volumes[i].data.volume);
  }

  return volume;
}

export function getTradePageUrl() {
  if (isLocal()) {
    return "http://localhost:3011/#/trade";
  }

  return "https://app.gmx.io/#/trade";
}

export function getPageTitle(data) {
  const title = t`Decentralized Perpetual Exchange | GMX`;
  return `${data} | ${title}`;
}
