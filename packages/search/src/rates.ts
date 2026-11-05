import type { PrismaClient } from '@clickauto/db';
import { parseRate, type UsdRates } from '@clickauto/shared';

/**
 * Latest known rates for the price filter: USD and EUR to lei (NBM) and USD to PMR rubles (PRB).
 * If a bank was unavailable, the last received rate is used. Null until all three are known.
 */
export async function latestUsdRates(prisma: PrismaClient): Promise<UsdRates | null> {
  const pick = async (base: 'USD' | 'EUR', quote: 'MDL' | 'PRB') => {
    const row = await prisma.exchangeRate.findFirst({
      where: { base, quote },
      orderBy: { date: 'desc' },
    });
    return row ? parseRate(row.rate.toString()) : null;
  };
  const [usdMdl, eurMdl, usdPrb] = await Promise.all([
    pick('USD', 'MDL'),
    pick('EUR', 'MDL'),
    pick('USD', 'PRB'),
  ]);
  return usdMdl && eurMdl && usdPrb ? { usdMdl, eurMdl, usdPrb } : null;
}
