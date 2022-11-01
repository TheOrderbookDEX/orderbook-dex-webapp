import { Orderbook, PriceTickerEventType } from '@theorderbookdex/orderbook-dex-webapi';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import { formatOrderbook, formatPrice, formatPriceChange, priceChangeStyle } from '../utils/format';

interface OrderbooksListItemProps {
  orderbook: Orderbook;
  saved: boolean;
  onSelect: (orderbook: Orderbook) => void;
  onSave: (orderbook: Orderbook) => void;
  onForget: (orderbook: Orderbook) => void;
}

export default function OrderbooksListItem({ orderbook, saved, onSelect, onSave, onForget }: OrderbooksListItemProps) {
  const [ lastPrice, setLastPrice ] = useState('');
  const [ priceChange, setPriceChange ] = useState<number>();

  useEffect(() => {
    if (!orderbook) return;

    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    void (async function() {
      try {
        const priceTicker = await orderbook.getPriceTicker(abortSignal);
        setLastPrice(formatPrice(orderbook, priceTicker.lastPrice));
        setPriceChange(priceTicker.priceChange);

        priceTicker.addEventListener(PriceTickerEventType.PRICE_CHANGED, event => {
          setLastPrice(formatPrice(orderbook, event.newPrice));
          setPriceChange(event.priceChange);
        }, { signal: abortSignal });

      } catch (error) {
        if (error !== abortSignal.reason) {
          // TODO handle other errors
          console.error(error);
        }
      }
    })();

    return () => abortController.abort();
  }, [ orderbook ]);

  const onStarClick = useCallback((event: MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    if (saved) {
      onForget(orderbook);
    } else {
      onSave(orderbook);
    }
  }, [ onForget, onSave, orderbook, saved ]);

  return (
    <tr onClick={() => onSelect(orderbook)}>
      <td className={saved ? 'text-primary' : ''}>
        <span onClick={onStarClick}>★</span>
      </td>
      <td>{formatOrderbook(orderbook)}</td>
      <td>{lastPrice}</td>
      <td className={priceChangeStyle(priceChange)}>{formatPriceChange(priceChange)}</td>
    </tr>
  );
}
