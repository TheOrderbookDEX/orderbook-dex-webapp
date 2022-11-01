import './PricePointsChart.scss';
import { useEffect, useMemo, useState } from 'react';
import PricePointsChartRow from './PricePointsChartRow';
import { Orderbook, OrderType, PricePoint, PricePointsEventType, PriceTickerEventType } from '@theorderbookdex/orderbook-dex-webapi';
import { Spinner, Table } from 'react-bootstrap';
import { formatPrice, formatPriceChange, priceChangeStyle } from '../utils/format';

const MAX_BOX_SIZE = 15;

interface PricePointsChartProps {
  orderbook?: Orderbook;
}

export default function PricePointsChart({ orderbook }: PricePointsChartProps) {
  const [ loading, setLoading ] = useState(false);
  const [ lastPrice, setLastPrice ] = useState('');
  const [ priceChange, setPriceChange ] = useState<number>();
  const [ buy, setBuy ] = useState<PricePoint[]>([]);
  const [ sell, setSell ] = useState<PricePoint[]>([]);

  useEffect(() => {
    if (!orderbook) return;

    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    setLoading(true);

    void (async () => {
      try {
        const priceTicker = await orderbook.getPriceTicker(abortSignal);
        setLastPrice(formatPrice(orderbook, priceTicker.lastPrice));
        setPriceChange(priceTicker.priceChange);

        priceTicker.addEventListener(PriceTickerEventType.PRICE_CHANGED, event => {
          setLastPrice(formatPrice(orderbook, event.newPrice));
          setPriceChange(event.priceChange);
        }, { signal: abortSignal });

        const pricePoints = await orderbook.getPricePoints(MAX_BOX_SIZE, abortSignal);

        setBuy(pricePoints.buy);
        setSell([ ...pricePoints.sell ].reverse());

        setLoading(false);

        pricePoints.addEventListener(PricePointsEventType.PRICE_POINT_ADDED, event => {
          (event.orderType === OrderType.BUY ? setBuy : setSell)(pricePoints => {
            let index = pricePoints.findIndex(({ price }) => price < event.price);
            if (index === -1) index = pricePoints.length;
            return [
              ...pricePoints.slice(0, index),
              { price: event.price, available: event.available },
              ...pricePoints.slice(index),
            ];
          });
        }, { signal: abortSignal });

        pricePoints.addEventListener(PricePointsEventType.PRICE_POINT_REMOVED, event => {
          (event.orderType === OrderType.BUY ? setBuy : setSell)(pricePoints => {
            return pricePoints.filter(({ price }) => price !== event.price);
          });
        }, { signal: abortSignal });

        pricePoints.addEventListener(PricePointsEventType.PRICE_POINT_UPDATED, event => {
          (event.orderType === OrderType.BUY ? setBuy : setSell)(pricePoints => {
            return pricePoints.map(pricePoint => {
              if (pricePoint.price === event.price) {
                return { price: event.price, available: event.available };
              } else {
                return pricePoint;
              }
            })
          });
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

  const maxAvailable = useMemo(() => {
    let maxAvailable = 0n;
    for (const { available } of [ ...buy, ...sell ]) {
      if (!maxAvailable || available > maxAvailable) {
        maxAvailable = available;
      }
    }
    return maxAvailable;
  }, [ buy, sell ]);

  return (
    <Table responsive hover className="orderbook-chart">
      <thead>
        <tr>
          <th>Price {orderbook && `(${orderbook.baseToken.symbol})`}</th>
          <th>Amount {orderbook && `(${orderbook.tradedToken.symbol})`}</th>
          <th>Total {orderbook && `(${orderbook.baseToken.symbol})`}</th>
        </tr>
      </thead>
      { loading ?
        <tbody>
          <tr>
            <td colSpan={3} className="text-center py-5">
              <Spinner animation="border" />
            </td>
          </tr>
        </tbody>

      : orderbook ?
        <>
          <tbody className="sell">
            {sell.map(pricePoint => (
              <PricePointsChartRow key={`${pricePoint.price}`} orderbook={orderbook} pricePoint={pricePoint} maxAvailable={maxAvailable} />
            ))}
          </tbody>
          <tbody>
            <tr>
              <td>
                <div>Last Price</div>
                {lastPrice}
              </td>
              <td></td>
              <td className={priceChangeStyle(priceChange)}>
                <div>Change (24hs)</div>
                {formatPriceChange(priceChange)}
              </td>
            </tr>
          </tbody>
          <tbody className="buy">
            {buy.map(pricePoint => (
              <PricePointsChartRow key={`${pricePoint.price}`} orderbook={orderbook} pricePoint={pricePoint} maxAvailable={maxAvailable} />
            ))}
          </tbody>
        </>

      :
        <></>
      }
    </Table>
  );
}
