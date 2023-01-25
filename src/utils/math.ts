import { Token } from '@theorderbookdex/orderbook-dex-webapi';

export function applyPercentage(token: Token, amount: string, percentage: string): string {
  const multiplier = BigInt(percentage.replace('.', ''));
  const divisor = 10n ** BigInt(percentage.replace(/^.*(\.|$)/, '').length + 3);
  return token.formatAmount(token.parseAmount(amount) * multiplier / divisor);
}
