import { Injectable } from '@nestjs/common';
import { latestUsdRates } from '@clickauto/search';
import { toUsdMinor, type Currency, type UsdRates } from '@clickauto/shared';
import { PrismaService } from '../../prisma/prisma.service';

/** Rates change once a day; a short cache keeps the feed from reading them on every request. */
const CACHE_MS = 10 * 60 * 1000;

/** Public service of the pricing module: conversion for the price filter and sorting. */
@Injectable()
export class PricingService {
  private cached: { rates: UsdRates | null; at: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async usdRates(): Promise<UsdRates | null> {
    if (this.cached && Date.now() - this.cached.at < CACHE_MS) return this.cached.rates;
    const rates = await latestUsdRates(this.prisma);
    this.cached = { rates, at: Date.now() };
    return rates;
  }

  /** Amount in minor units to USD minor units; null if rates for a non-USD currency are unknown. */
  async toUsdMinor(amount: number, currency: Currency): Promise<number | null> {
    if (currency === 'USD') return amount;
    const rates = await this.usdRates();
    return rates ? toUsdMinor(amount, currency, rates) : null;
  }
}
