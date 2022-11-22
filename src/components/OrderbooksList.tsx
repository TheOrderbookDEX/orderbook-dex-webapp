import './OrderbooksList.scss';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, InputGroup, Spinner, Table } from 'react-bootstrap';
import { Orderbook, OrderbookDEX } from '@theorderbookdex/orderbook-dex-webapi';
import OrderbooksListItem from './OrderbooksListItem';
import { OrderbooksFilter, OrderbooksFilterModal } from './OrderbooksFilterModal';

interface OrderbooksListProps {
  onSelect: (orderbook: Orderbook) => void;
}

export default function OrderbooksList({ onSelect }: OrderbooksListProps) {
  const [ showFilterModal, setShowFilterModal ] = useState(false);
  const [ filter, setFilter ] = useState<OrderbooksFilter>({ tracked: true });
  const [ loading, setLoading ] = useState(true);
  const [ orderbooks, setOrderbooks ] = useState<{[address: string]: Orderbook}>({});

  const search = useMemo(() => {
    const search: string[] = [];

    if (filter.tracked) {
      search.push('Only ★');
    }

    if (filter.tradedToken) {
      search.push(`Trade ${filter.tradedToken.symbol}`);
    }

    if (filter.baseToken) {
      search.push(`Price in ${filter.baseToken.symbol}`);
    }

    return search.join(', ');
  }, [ filter ]);

  useEffect(() => {
    setLoading(true);
    setOrderbooks({});

    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    void (async () => {
      try {
        for await (const orderbook of OrderbookDEX.instance.getOrderbooks({
          tracked: filter.tracked,
          tradedToken: filter.tradedToken?.address,
          baseToken: filter.baseToken?.address,
        }, abortSignal)) {
          setOrderbooks(orderbooks => ({ ...orderbooks, [orderbook.address]: orderbook }));
        }
        setLoading(false);

      } catch (error) {
        if (error !== abortController.signal.reason) {
          // TODO handle other errors
          console.error(error);
        }
      }
    })();

    return () => abortController.abort();
  }, [ filter ]);

  const trackOrderbook = useCallback(async (orderbook: Orderbook) => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    await OrderbookDEX.instance.trackOrderbook(orderbook, abortSignal);
    orderbook = await OrderbookDEX.instance.getOrderbook(orderbook.address, abortSignal);
    setOrderbooks(orderbooks => ({ ...orderbooks, [orderbook.address]: orderbook }));
  }, []);

  const forgetOrderbook = useCallback(async (orderbook: Orderbook) => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    await OrderbookDEX.instance.forgetOrderbook(orderbook);
    orderbook = await OrderbookDEX.instance.getOrderbook(orderbook.address, abortSignal);
    setOrderbooks(orderbooks => ({ ...orderbooks, [orderbook.address]: orderbook }));
  }, []);

  return (
    <div className="orderbooks-list">
      <InputGroup size="sm">
        <InputGroup.Text>🔍︎</InputGroup.Text>
        <Form.Control
          readOnly
          placeholder="Search"
          value={search}
          onFocus={event => { event.target.blur(); setShowFilterModal(true) }}
        />
      </InputGroup>

      <OrderbooksFilterModal
        filter={filter}
        onChange={setFilter}
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
      />

      <Table responsive hover>
        <thead>
          <tr>
            <th>★</th>
            <th>Orderbook</th>
            <th>Last Price</th>
            <th>Change (24hs)</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(orderbooks).map(orderbook => (
            <OrderbooksListItem
              key={`${orderbook.address}`}
              orderbook={orderbook}
              onSelect={onSelect}
              onTrack={trackOrderbook}
              onForget={forgetOrderbook} />
          ))}
          {loading &&
            <tr>
              <td colSpan={4} className="text-center">
                <Spinner animation="border" />
              </td>
            </tr>
          }
        </tbody>
      </Table>
    </div>
  );
}
