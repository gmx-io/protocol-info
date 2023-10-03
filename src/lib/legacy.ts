import { useCallback, useEffect, useMemo, useState } from "react";
import { bigNumberify, expandDecimals, parseValue } from "./numbers";
import { gql } from "@apollo/client";
import { getGmxGraphClient } from "./subgraph";
import { t } from "@lingui/macro";
import { BigNumber, ethers } from "ethers";
import { BASIS_POINTS_DIVISOR } from "config/factors";
import { ARBITRUM, AVALANCHE } from "config/chains";
import { getContract } from "config/contracts";
import useSWR from "swr";
import { contractFetcher } from "./contracts/contractFetcher";
import Vault from "abis/Vault.json";
import UniPool from "abis/UniPool.json";
import { getTokenBySymbol } from "config/tokens";
import { Token as UniToken } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v3-sdk";
import UniswapV2 from "abis/UniswapV2.json";

export const REFERRAL_CODE_QUERY_PARAM = "ref";
export const USD_DECIMALS = 30;
export const PRECISION = expandDecimals(1, 30);
export const PLACEHOLDER_ACCOUNT = ethers.Wallet.createRandom().address;
export const SECONDS_PER_YEAR = 31536000;
export const GLP_DECIMALS = 18;

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

export function getBalanceAndSupplyData(balances) {
  if (!balances || balances.length === 0) {
    return {};
  }

  const keys = ["gmx", "esGmx", "glp", "stakedGmxTracker"];
  const balanceData = {};
  const supplyData = {};
  const propsLength = 2;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    balanceData[key] = balances[i * propsLength];
    supplyData[key] = balances[i * propsLength + 1];
  }

  return { balanceData, supplyData };
}

export function getDepositBalanceData(depositBalances) {
  if (!depositBalances || depositBalances.length === 0) {
    return;
  }

  const keys = [
    "gmxInStakedGmx",
    "esGmxInStakedGmx",
    "stakedGmxInBonusGmx",
    "bonusGmxInFeeGmx",
    "bnGmxInFeeGmx",
    "glpInStakedGlp",
  ];
  const data = {};

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    data[key] = depositBalances[i];
  }

  return data;
}

export function getVestingData(vestingInfo) {
  if (!vestingInfo || vestingInfo.length === 0) {
    return;
  }

  const keys = ["gmxVester", "glpVester"];
  const data = {};
  const propsLength = 7;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    data[key] = {
      pairAmount: vestingInfo[i * propsLength],
      vestedAmount: vestingInfo[i * propsLength + 1],
      escrowedBalance: vestingInfo[i * propsLength + 2],
      claimedAmounts: vestingInfo[i * propsLength + 3],
      claimable: vestingInfo[i * propsLength + 4],
      maxVestableAmount: vestingInfo[i * propsLength + 5],
      averageStakedAmount: vestingInfo[i * propsLength + 6],
    };

    data[key + "PairAmount"] = data[key].pairAmount;
    data[key + "VestedAmount"] = data[key].vestedAmount;
    data[key + "EscrowedBalance"] = data[key].escrowedBalance;
    data[key + "ClaimSum"] = data[key].claimedAmounts.add(data[key].claimable);
    data[key + "Claimable"] = data[key].claimable;
    data[key + "MaxVestableAmount"] = data[key].maxVestableAmount;
    data[key + "AverageStakedAmount"] = data[key].averageStakedAmount;
  }

  return data;
}

export function getStakingData(stakingInfo) {
  if (!stakingInfo || stakingInfo.length === 0) {
    return;
  }

  const keys = ["stakedGmxTracker", "bonusGmxTracker", "feeGmxTracker", "stakedGlpTracker", "feeGlpTracker"];
  const data = {};
  const propsLength = 5;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    data[key] = {
      claimable: stakingInfo[i * propsLength],
      tokensPerInterval: stakingInfo[i * propsLength + 1],
      averageStakedAmounts: stakingInfo[i * propsLength + 2],
      cumulativeRewards: stakingInfo[i * propsLength + 3],
      totalSupply: stakingInfo[i * propsLength + 4],
    };
  }

  return data;
}

export function getProcessedData(
  balanceData,
  supplyData,
  depositBalanceData,
  stakingData,
  vestingData,
  aum,
  nativeTokenPrice,
  stakedGmxSupply,
  gmxPrice,
  gmxSupply
) {
  if (
    !balanceData ||
    !supplyData ||
    !depositBalanceData ||
    !stakingData ||
    !vestingData ||
    !aum ||
    !nativeTokenPrice ||
    !stakedGmxSupply ||
    !gmxPrice ||
    !gmxSupply
  ) {
    return {};
  }

  const data: any = {};

  data.gmxBalance = balanceData.gmx;
  data.gmxBalanceUsd = balanceData.gmx.mul(gmxPrice).div(expandDecimals(1, 18));

  data.gmxSupply = bigNumberify(gmxSupply);

  data.gmxSupplyUsd = data.gmxSupply.mul(gmxPrice).div(expandDecimals(1, 18));
  data.stakedGmxSupply = stakedGmxSupply;
  data.stakedGmxSupplyUsd = stakedGmxSupply.mul(gmxPrice).div(expandDecimals(1, 18));
  data.gmxInStakedGmx = depositBalanceData.gmxInStakedGmx;
  data.gmxInStakedGmxUsd = depositBalanceData.gmxInStakedGmx.mul(gmxPrice).div(expandDecimals(1, 18));

  data.esGmxBalance = balanceData.esGmx;
  data.esGmxBalanceUsd = balanceData.esGmx.mul(gmxPrice).div(expandDecimals(1, 18));

  data.stakedGmxTrackerSupply = supplyData.stakedGmxTracker;
  data.stakedGmxTrackerSupplyUsd = supplyData.stakedGmxTracker.mul(gmxPrice).div(expandDecimals(1, 18));
  data.stakedEsGmxSupply = data.stakedGmxTrackerSupply.sub(data.stakedGmxSupply);
  data.stakedEsGmxSupplyUsd = data.stakedEsGmxSupply.mul(gmxPrice).div(expandDecimals(1, 18));

  data.esGmxInStakedGmx = depositBalanceData.esGmxInStakedGmx;
  data.esGmxInStakedGmxUsd = depositBalanceData.esGmxInStakedGmx.mul(gmxPrice).div(expandDecimals(1, 18));

  data.bnGmxInFeeGmx = depositBalanceData.bnGmxInFeeGmx;
  data.bonusGmxInFeeGmx = depositBalanceData.bonusGmxInFeeGmx;
  data.feeGmxSupply = stakingData.feeGmxTracker.totalSupply;
  data.feeGmxSupplyUsd = data.feeGmxSupply.mul(gmxPrice).div(expandDecimals(1, 18));

  data.stakedGmxTrackerRewards = stakingData.stakedGmxTracker.claimable;
  data.stakedGmxTrackerRewardsUsd = stakingData.stakedGmxTracker.claimable.mul(gmxPrice).div(expandDecimals(1, 18));

  data.bonusGmxTrackerRewards = stakingData.bonusGmxTracker.claimable;

  data.feeGmxTrackerRewards = stakingData.feeGmxTracker.claimable;
  data.feeGmxTrackerRewardsUsd = stakingData.feeGmxTracker.claimable.mul(nativeTokenPrice).div(expandDecimals(1, 18));

  data.boostBasisPoints = bigNumberify(0);
  if (data && data.bnGmxInFeeGmx && data.bonusGmxInFeeGmx && data.bonusGmxInFeeGmx.gt(0)) {
    data.boostBasisPoints = data.bnGmxInFeeGmx.mul(BASIS_POINTS_DIVISOR).div(data.bonusGmxInFeeGmx);
  }

  data.stakedGmxTrackerAnnualRewardsUsd = stakingData.stakedGmxTracker.tokensPerInterval
    .mul(SECONDS_PER_YEAR)
    .mul(gmxPrice)
    .div(expandDecimals(1, 18));
  data.gmxAprForEsGmx =
    data.stakedGmxTrackerSupplyUsd && data.stakedGmxTrackerSupplyUsd.gt(0)
      ? data.stakedGmxTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(data.stakedGmxTrackerSupplyUsd)
      : bigNumberify(0);
  data.feeGmxTrackerAnnualRewardsUsd = stakingData.feeGmxTracker.tokensPerInterval
    .mul(SECONDS_PER_YEAR)
    .mul(nativeTokenPrice)
    .div(expandDecimals(1, 18));
  data.gmxAprForNativeToken =
    data.feeGmxSupplyUsd && data.feeGmxSupplyUsd.gt(0)
      ? data.feeGmxTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(data.feeGmxSupplyUsd)
      : bigNumberify(0);
  data.gmxBoostAprForNativeToken = data.gmxAprForNativeToken.mul(data.boostBasisPoints).div(BASIS_POINTS_DIVISOR);
  data.gmxAprTotal = data.gmxAprForNativeToken.add(data.gmxAprForEsGmx);
  data.gmxAprTotalWithBoost = data.gmxAprForNativeToken.add(data.gmxBoostAprForNativeToken).add(data.gmxAprForEsGmx);
  data.gmxAprForNativeTokenWithBoost = data.gmxAprForNativeToken.add(data.gmxBoostAprForNativeToken);

  data.totalGmxRewardsUsd = data.stakedGmxTrackerRewardsUsd.add(data.feeGmxTrackerRewardsUsd);

  data.glpSupply = supplyData.glp;
  data.glpPrice =
    data.glpSupply && data.glpSupply.gt(0)
      ? aum.mul(expandDecimals(1, GLP_DECIMALS)).div(data.glpSupply)
      : bigNumberify(0);

  data.glpSupplyUsd = supplyData.glp.mul(data.glpPrice).div(expandDecimals(1, 18));

  data.glpBalance = depositBalanceData.glpInStakedGlp;
  data.glpBalanceUsd = depositBalanceData.glpInStakedGlp.mul(data.glpPrice).div(expandDecimals(1, GLP_DECIMALS));

  data.stakedGlpTrackerRewards = stakingData.stakedGlpTracker.claimable;
  data.stakedGlpTrackerRewardsUsd = stakingData.stakedGlpTracker.claimable.mul(gmxPrice).div(expandDecimals(1, 18));

  data.feeGlpTrackerRewards = stakingData.feeGlpTracker.claimable;
  data.feeGlpTrackerRewardsUsd = stakingData.feeGlpTracker.claimable.mul(nativeTokenPrice).div(expandDecimals(1, 18));

  data.stakedGlpTrackerAnnualRewardsUsd = stakingData.stakedGlpTracker.tokensPerInterval
    .mul(SECONDS_PER_YEAR)
    .mul(gmxPrice)
    .div(expandDecimals(1, 18));
  data.glpAprForEsGmx =
    data.glpSupplyUsd && data.glpSupplyUsd.gt(0)
      ? data.stakedGlpTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(data.glpSupplyUsd)
      : bigNumberify(0);
  data.feeGlpTrackerAnnualRewardsUsd = stakingData.feeGlpTracker.tokensPerInterval
    .mul(SECONDS_PER_YEAR)
    .mul(nativeTokenPrice)
    .div(expandDecimals(1, 18));
  data.glpAprForNativeToken =
    data.glpSupplyUsd && data.glpSupplyUsd.gt(0)
      ? data.feeGlpTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(data.glpSupplyUsd)
      : bigNumberify(0);
  data.glpAprTotal = data.glpAprForNativeToken.add(data.glpAprForEsGmx);

  data.totalGlpRewardsUsd = data.stakedGlpTrackerRewardsUsd.add(data.feeGlpTrackerRewardsUsd);

  data.totalEsGmxRewards = data.stakedGmxTrackerRewards.add(data.stakedGlpTrackerRewards);
  data.totalEsGmxRewardsUsd = data.stakedGmxTrackerRewardsUsd.add(data.stakedGlpTrackerRewardsUsd);

  data.gmxVesterRewards = vestingData.gmxVester.claimable;
  data.glpVesterRewards = vestingData.glpVester.claimable;
  data.totalVesterRewards = data.gmxVesterRewards.add(data.glpVesterRewards);
  data.totalVesterRewardsUsd = data.totalVesterRewards.mul(gmxPrice).div(expandDecimals(1, 18));

  data.totalNativeTokenRewards = data.feeGmxTrackerRewards.add(data.feeGlpTrackerRewards);
  data.totalNativeTokenRewardsUsd = data.feeGmxTrackerRewardsUsd.add(data.feeGlpTrackerRewardsUsd);

  data.totalRewardsUsd = data.totalEsGmxRewardsUsd.add(data.totalNativeTokenRewardsUsd).add(data.totalVesterRewardsUsd);

  return data;
}

export function useGmxPrice(chainId, libraries, active) {
  const arbitrumLibrary = libraries && libraries.arbitrum ? libraries.arbitrum : undefined;
  const { data: gmxPriceFromArbitrum, mutate: mutateFromArbitrum } = useGmxPriceFromArbitrum(arbitrumLibrary, active);
  const { data: gmxPriceFromAvalanche, mutate: mutateFromAvalanche } = useGmxPriceFromAvalanche();

  const gmxPrice = chainId === ARBITRUM ? gmxPriceFromArbitrum : gmxPriceFromAvalanche;
  const mutate = useCallback(() => {
    mutateFromAvalanche();
    mutateFromArbitrum();
  }, [mutateFromAvalanche, mutateFromArbitrum]);

  return {
    gmxPrice,
    gmxPriceFromArbitrum,
    gmxPriceFromAvalanche,
    mutate,
  };
}

function useGmxPriceFromArbitrum(signer, active) {
  const poolAddress = getContract(ARBITRUM, "UniswapGmxEthPool");
  const { data: uniPoolSlot0, mutate: updateUniPoolSlot0 } = useSWR<any>(
    [`StakeV2:uniPoolSlot0:${active}`, ARBITRUM, poolAddress, "slot0"],
    {
      fetcher: contractFetcher(signer, UniPool),
    }
  );

  const vaultAddress = getContract(ARBITRUM, "Vault");
  const ethAddress = getTokenBySymbol(ARBITRUM, "WETH").address;
  const { data: ethPrice, mutate: updateEthPrice } = useSWR<BigNumber>(
    [`StakeV2:ethPrice:${active}`, ARBITRUM, vaultAddress, "getMinPrice", ethAddress],
    {
      fetcher: contractFetcher(signer, Vault) as any,
    }
  );

  const gmxPrice = useMemo(() => {
    if (uniPoolSlot0 && ethPrice) {
      const tokenA = new UniToken(ARBITRUM, ethAddress, 18, "SYMBOL", "NAME");

      const gmxAddress = getContract(ARBITRUM, "GMX");
      const tokenB = new UniToken(ARBITRUM, gmxAddress, 18, "SYMBOL", "NAME");

      const pool = new Pool(
        tokenA, // tokenA
        tokenB, // tokenB
        10000, // fee
        uniPoolSlot0.sqrtPriceX96, // sqrtRatioX96
        1, // liquidity
        uniPoolSlot0.tick, // tickCurrent
        []
      );

      const poolTokenPrice = pool.priceOf(tokenB).toSignificant(6);
      const poolTokenPriceAmount = parseValue(poolTokenPrice, 18);
      return poolTokenPriceAmount?.mul(ethPrice).div(expandDecimals(1, 18));
    }
  }, [ethPrice, uniPoolSlot0, ethAddress]);

  const mutate = useCallback(() => {
    updateUniPoolSlot0(undefined, true);
    updateEthPrice(undefined, true);
  }, [updateEthPrice, updateUniPoolSlot0]);

  return { data: gmxPrice, mutate };
}

function useGmxPriceFromAvalanche() {
  const poolAddress = getContract(AVALANCHE, "TraderJoeGmxAvaxPool");

  const { data, mutate: updateReserves } = useSWR(["TraderJoeGmxAvaxReserves", AVALANCHE, poolAddress, "getReserves"], {
    fetcher: contractFetcher(undefined, UniswapV2),
  });
  const { _reserve0: gmxReserve, _reserve1: avaxReserve }: any = data || {};

  const vaultAddress = getContract(AVALANCHE, "Vault");
  const avaxAddress = getTokenBySymbol(AVALANCHE, "WAVAX").address;
  const { data: avaxPrice, mutate: updateAvaxPrice } = useSWR(
    [`StakeV2:avaxPrice`, AVALANCHE, vaultAddress, "getMinPrice", avaxAddress],
    {
      fetcher: contractFetcher(undefined, Vault),
    }
  );

  const PRECISION = bigNumberify(10)!.pow(18);
  let gmxPrice;
  if (avaxReserve && gmxReserve && avaxPrice) {
    gmxPrice = avaxReserve.mul(PRECISION).div(gmxReserve).mul(avaxPrice).div(PRECISION);
  }

  const mutate = useCallback(() => {
    updateReserves(undefined, true);
    updateAvaxPrice(undefined, true);
  }, [updateReserves, updateAvaxPrice]);

  return { data: gmxPrice, mutate };
}
