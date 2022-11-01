import { Orderbook, PricePoint } from '@theorderbookdex/orderbook-dex-webapi';
import { useMemo } from 'react';
import { formatPrice, formatPricePointAvailable, formatPricePointTotal } from '../utils/format';

interface PricePointsChartRowProps {
  orderbook: Orderbook;
  pricePoint: PricePoint;
  maxAvailable: bigint;
}

export default function PricePointsChartRow({ orderbook, pricePoint, maxAvailable }: PricePointsChartRowProps) {
  const backgroundSize = useMemo(() => {
    return `${100n * pricePoint.available / maxAvailable}% 100%`;
  }, [ pricePoint, maxAvailable ]);

  const price = useMemo(() => formatPrice(orderbook, pricePoint.price), [ orderbook, pricePoint ]);
  const available = useMemo(() => formatPricePointAvailable(orderbook, pricePoint), [ orderbook, pricePoint ]);
  const total = useMemo(() => formatPricePointTotal(orderbook, pricePoint), [ orderbook, pricePoint ]);

  return (
    <tr style={{ backgroundSize }}>
      <td>{price}</td>
      <td>{available}</td>
      <td>{total}</td>
    </tr>
  );
}
