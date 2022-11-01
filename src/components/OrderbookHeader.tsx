import { Orderbook, PriceTickerEventType } from '@theorderbookdex/orderbook-dex-webapi';
import { useEffect, useMemo, useState } from 'react';
import { Spinner, Stack } from 'react-bootstrap';
import { formatContractSize, formatOrderbookPair, formatPrice, formatPriceChange, formatPriceTick, priceChangeStyle } from '../utils/format';

interface OrderbookHeaderProps {
  orderbook?: Orderbook;
}

export default function OrderbookHeader({ orderbook }: OrderbookHeaderProps) {
  const pair = useMemo(() => orderbook && formatOrderbookPair(orderbook), [ orderbook ]);
  const contractSize = useMemo(() => orderbook && formatContractSize(orderbook, { withSymbol: true }), [ orderbook ]);
  const priceTick = useMemo(() => orderbook && formatPriceTick(orderbook, { withSymbol: true }), [ orderbook ]);

  const [ loading, setLoading ] = useState(false);
  const [ lastPrice, setLastPrice ] = useState<string>();
  const [ priceChange, setPriceChange ] = useState<number>();

  useEffect(() => {
    if (!orderbook) return;

    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    setLoading(true);

    void (async function() {
      try {
        const priceTicker = await orderbook.getPriceTicker(abortSignal);
        setLastPrice(formatPrice(orderbook, priceTicker.lastPrice, { withSymbol: true }));
        setPriceChange(priceTicker.priceChange);
        setLoading(false);

        priceTicker.addEventListener(PriceTickerEventType.PRICE_CHANGED, event => {
          setLastPrice(formatPrice(orderbook, event.newPrice, { withSymbol: true }));
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

  return (
    <Stack direction="horizontal" className="align-items-stretch overflow-auto text-nowrap font-monospace border-bottom">
      { loading ?
        <Spinner className="m-3" animation="border" />
      : orderbook ?
        <>
          <h1 className="p-3 m-0 border-end">{pair}</h1>
          <div className="p-3">
            <div className="text-muted">Last Price</div>
            <div className={`text-end ${priceChangeStyle(priceChange)}`}>{lastPrice}</div>
          </div>
          <div className="p-3">
            <div className="text-muted">Change (24hs)</div>
            <div className={`text-end ${priceChangeStyle(priceChange)}`}>{formatPriceChange(priceChange)}</div>
          </div>
          <div className="p-3">
            <div className="text-muted">Contract Size</div>
            <div className="text-end">{contractSize}</div>
          </div>
          <div className="p-3">
            <div className="text-muted">Price Tick</div>
            <div className="text-end">{priceTick}</div>
          </div>
        </>
      :
        <div className="p-3">
          Please select an orderbook from the orderbooks list
        </div>
      }
    </Stack>
  );
}
