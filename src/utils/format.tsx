import { Address, formatVersion, Order, Orderbook, OrderExecutionType, OrderType, PricePoint } from '@theorderbookdex/orderbook-dex-webapi';
import { format } from 'date-fns';

export function formatShorterAddress(address: Address): string {
  return address.replace(/(?<=.{8}).*(?=.{6})/, '...');
}

export function formatTimestamp(timestamp: number) {
  return format(timestamp * 1000, 'yyyy-MM-dd HH:mm');
}

export function formatOrderbookPair(orderbook: Orderbook) {
  return `${orderbook.tradedToken.symbol}/${orderbook.baseToken.symbol}`;
}

export function formatOrderbookConfig(orderbook: Orderbook) {
  return `${formatContractSize(orderbook)}/${formatPriceTick(orderbook)}`;
}

export function formatOrderbookVersion(orderbook: Orderbook) {
  return formatVersion(orderbook.version);
}

export function formatOrderbook(orderbook: Orderbook) {
  return `${formatOrderbookPair(orderbook)} [${formatOrderbookConfig(orderbook)}] [${formatOrderbookVersion(orderbook)}]`;
}

export function formatPriceChange(priceChange?: number): string {
  if (priceChange === undefined) return '';
  return `${ priceChange > 0 ? '+' : '' }${ (priceChange * 100).toFixed(2) }%`;
}

export function priceChangeStyle(priceChange?: number): 'text-success' | 'text-danger' | '' {
  if (!priceChange) return '';
  if (priceChange > 0) return 'text-success';
  return 'text-danger';
}

interface FormatTokenOptions {
  withSymbol?: boolean;
}

export function formatContractSize(orderbook: Orderbook, opts?: FormatTokenOptions) {
  const formatted = orderbook.tradedToken.formatAmount(orderbook.contractSize);
  const suffix = opts?.withSymbol ? ` ${orderbook.tradedToken.symbol}` : '';
  return `${formatted}${suffix}`;
}

export function formatPriceTick(orderbook: Orderbook, opts?: FormatTokenOptions) {
  return formatPrice(orderbook, orderbook.priceTick, opts);
}

export function formatPrice(orderbook: Orderbook, contractPrice?: bigint, opts?: FormatTokenOptions) {
  if (contractPrice === undefined) return '';
  const unitPrice = contractPrice * orderbook.tradedToken.unit / orderbook.contractSize;
  const formatted = orderbook.baseToken.formatAmount(unitPrice);
  const suffix = opts?.withSymbol ? ` ${orderbook.baseToken.symbol}` : '';
  return `${formatted}${suffix}`;
}

export function parsePrice(orderbook: Orderbook, price: string) {
  const { tradedToken, baseToken, contractSize } = orderbook;
  return baseToken.parseAmount(price) * contractSize / tradedToken.unit;
}

export function formatContractAmount(orderbook: Orderbook, amount: bigint, opts?: FormatTokenOptions) {
  const tokenAmount = amount * orderbook.contractSize;
  const formatted = orderbook.tradedToken.formatAmount(tokenAmount);
  const suffix = opts?.withSymbol ? ` ${orderbook.tradedToken.symbol}` : '';
  return `${formatted}${suffix}`;
}

export function parseContractAmount(orderbook: Orderbook, amount: string) {
  const { tradedToken, contractSize } = orderbook;
  return tradedToken.parseAmount(amount) / contractSize;
}

export function formatPricePointAvailable(orderbook: Orderbook, pricePoint: PricePoint) {
  return orderbook.tradedToken.formatAmount(pricePoint.available * orderbook.contractSize);
}

export function formatPricePointTotal(orderbook: Orderbook, pricePoint: PricePoint) {
  return orderbook.baseToken.formatAmount(pricePoint.available * pricePoint.price);
}

export function formatOrderTime(order: Order) {
  return formatTimestamp(order.timestamp);
}

export function formatOrderExecutionType(order: Order) {
  switch (order.execution) {
    case OrderExecutionType.MARKET:
      return 'Market';
    case OrderExecutionType.LIMIT:
      return 'Limit';
  }
}

export function formatOrderTradeType(order: Order) {
  return order.type === OrderType.BUY ? 'Buy' : 'Sell';
}

export function formatOrderAmount(order: Order) {
  return formatContractAmount(order.orderbook, order.amount, { withSymbol: true });
}

export function formatOrderPrice(order: Order) {
  switch (order.execution) {
    case OrderExecutionType.MARKET:
      return `${(order.type === OrderType.BUY) ? '≤' : '≥'} ${formatPrice(order.orderbook, order.price, { withSymbol: true })}`;

    case OrderExecutionType.LIMIT:
      return formatPrice(order.orderbook, order.price, { withSymbol: true });
  }
}

export function formatOrderExecuted(order: Order) {
  return formatContractAmount(order.orderbook, order.filled, { withSymbol: true });
}

export function formatOrderExecutedPrice(order: Order) {
  return formatPrice(order.orderbook, order.filled && order.totalPrice / order.filled, { withSymbol: true });
}

export function formatOrderClaimed(order: Order): string {
  switch (order.type) {
    case OrderType.BUY:
      return formatContractAmount(order.orderbook, order.claimed, { withSymbol: true });
    case OrderType.SELL:
      return `${order.orderbook.baseToken.formatAmount(order.totalPriceClaimed)} ${order.orderbook.baseToken.symbol}`;
  }
}

export function formatOrderFilled(order: Order) {
  switch (order.type) {
    case OrderType.BUY:
      return formatContractAmount(order.orderbook, order.filled, { withSymbol: true });
    case OrderType.SELL:
      return `${order.orderbook.baseToken.formatAmount(order.totalPrice)} ${order.orderbook.baseToken.symbol}`;
  }
}
