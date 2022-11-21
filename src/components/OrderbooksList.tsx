import './OrderbooksList.scss';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, InputGroup, Nav, Table } from 'react-bootstrap';
import { Orderbook, OrderbookDEX, Token } from '@theorderbookdex/orderbook-dex-webapi';
import OrderbooksListItem from './OrderbooksListItem';
import { formatOrderbook } from '../utils/format';

interface OrderbooksListProps {
  onSelect: (orderbook: Orderbook) => void;
}

export default function OrderbooksList({ onSelect }: OrderbooksListProps) {
  const [ search, setSearch ] = useState('');
  const [ token, setToken ] = useState('');
  const [ savedOrderbooks, setSavedOrderbooks ] = useState<Orderbook[]>([]);
  const [ tokens, setTokens ] = useState<Token[]>([]);
  const [ allOrderbooks, setAllOrderbooks ] = useState<Orderbook[]>([]);

  const orderbooks = useMemo(() => {
    if (search) {
      const orderbooks: Orderbook[] = [];
      for (const orderbook of allOrderbooks) {
        if (formatOrderbook(orderbook).toLowerCase().includes(search.toLowerCase())) {
          orderbooks.push(orderbook);
        }
      }
      return orderbooks;

    } else if (token) {
      const orderbooks: Orderbook[] = [];
      for (const orderbook of allOrderbooks) {
        if (orderbook.tradedToken.address === token || orderbook.baseToken.address === token) {
          orderbooks.push(orderbook);
        }
      }
      return orderbooks;

    } else {
      return savedOrderbooks;
    }
  }, [ search, token, savedOrderbooks, allOrderbooks ]);

  useEffect(() => {
    setSavedOrderbooks([]);
    setTokens([]);
    setAllOrderbooks([]);

    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    void (async () => {
      try {
        for await (const orderbook of OrderbookDEX.instance.getOrderbooks({ tracked: true }, abortSignal)) {
          setSavedOrderbooks(orderbooks => orderbooks.concat([ orderbook ]));
        }
        for await (const token of OrderbookDEX.instance.getTokens(abortSignal)) {
          setTokens(tokens => tokens.concat([ token ]));
        }
        for await (const orderbook of OrderbookDEX.instance.getOrderbooks({}, abortSignal)) {
          setAllOrderbooks(orderbooks => orderbooks.concat([ orderbook ]));
        }
      } catch (error) {
        if (error !== abortController.signal.reason) {
          // TODO handle other errors
          console.error(error);
        }
      }
    })();

    return () => abortController.abort();
  }, []);

  const isSaved = useCallback((orderbook: Orderbook) => {
    return savedOrderbooks.some(({ address }) => address === orderbook.address);
  }, [ savedOrderbooks ]);

  const saveOrderbook = useCallback(async (orderbook: Orderbook) => {
    await OrderbookDEX.instance.trackOrderbook(orderbook);
    setSavedOrderbooks(orderbooks => orderbooks.concat([orderbook]));
  }, []);

  const forgetOrderbook = useCallback(async (orderbook: Orderbook) => {
    await OrderbookDEX.instance.forgetOrderbook(orderbook);
    setSavedOrderbooks(orderbooks => orderbooks.filter(o => o !== orderbook));
  }, []);

  return (
    <div className="orderbooks-list">
      <InputGroup size="sm">
        <InputGroup.Text>🔍︎</InputGroup.Text>
        <Form.Control placeholder="Search" value={search} onChange={event => setSearch(event.target.value)} />
      </InputGroup>
      <Nav variant="tabs" activeKey={token} onSelect={token => setToken(token as string)}>
        <Nav.Link eventKey="">★</Nav.Link>
        {tokens.map(token => (
          <Nav.Link key={token.address} eventKey={token.address}>{token.symbol}</Nav.Link>
        ))}
      </Nav>
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
          {orderbooks.map(orderbook => (
            <OrderbooksListItem
              key={`${orderbook.address}`}
              orderbook={orderbook}
              saved={isSaved(orderbook)}
              onSelect={onSelect}
              onSave={saveOrderbook}
              onForget={forgetOrderbook} />
          ))}
        </tbody>
      </Table>
    </div>
  );
}
