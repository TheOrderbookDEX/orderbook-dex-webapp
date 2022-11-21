import './Orders.scss';
import { Operator, OperatorEventType, Order, OrderStatus, RequestRejected } from '@theorderbookdex/orderbook-dex-webapi';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Dropdown, Nav, Table } from 'react-bootstrap';
import { WalletContext } from '../context/WalletContext';
import { formatOrderAmount, formatOrderbook, formatOrderClaimed, formatOrderExecutedPrice, formatOrderExecutionType, formatOrderExecuted, formatOrderPrice, formatOrderTime, formatOrderTradeType, formatOrderFilled } from '../utils/format';

function formatOrderStatus(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING:          return 'PENDING';
    case OrderStatus.OPEN:             return 'OPEN';
    case OrderStatus.NOT_FILLED:       return 'NOT FILLED';
    case OrderStatus.PARTIALLY_FILLED: return 'PARTIALLY FILLED';
    case OrderStatus.FILLED:           return 'FILLED';
    case OrderStatus.CLAIMABLE:        return 'CLAIMABLE';
    case OrderStatus.PENDING_CLAIM:    return 'PENDING CLAIM';
    case OrderStatus.CLAIMED:          return 'CLAIMED';
    case OrderStatus.CANCELABLE:       return 'CANCELABLE';
    case OrderStatus.PENDING_CANCEL:   return 'PENDING CANCEL';
    case OrderStatus.CANCELED:         return 'CANCELED';
    case OrderStatus.CLOSED:           return 'CLOSED';
    case OrderStatus.ERROR:            return 'ERROR';
  }
}

function renderOrderStatus(order: Order) {
  return order.status.map((status, index) =>
    <span key={index}>{formatOrderStatus(status)}<br /></span>
  );
}

interface OrderButtonsCallbacks {
  claim(order: Order): void;
  cancel(order: Order): void;
  dismiss(order: Order): void;
}

function renderOrderButtons(order: Order, { claim, cancel, dismiss }: OrderButtonsCallbacks, disabled: boolean) {
  const showClaim = order.status.includes(OrderStatus.CLAIMABLE);
  const showCancel = order.status.includes(OrderStatus.CANCELABLE);
  const showDismiss = order.status.includes(OrderStatus.CLOSED);
  return (showClaim || showCancel || showDismiss) && (
    <Dropdown align="end">
      <Dropdown.Toggle variant="secondary" size="sm">▼</Dropdown.Toggle>
      <Dropdown.Menu renderOnMount>
        {showClaim && <Dropdown.Item disabled={disabled} onClick={() => claim(order)}>CLAIM</Dropdown.Item>}
        {showCancel && <Dropdown.Item disabled={disabled} onClick={() => cancel(order)}>CANCEL</Dropdown.Item>}
        {showDismiss && <Dropdown.Item disabled={disabled} onClick={() => dismiss(order)}>DISMISS</Dropdown.Item>}
      </Dropdown.Menu>
    </Dropdown>
  );
}

enum OrdersTab {
  RECENT = 'recent',
  OPEN = 'open',
  CLOSED = 'closed',
}

function sortOrders(orders: Order[]) {
  return orders.sort((a, b) => b.timestamp - a.timestamp);
}

function addOrder(orders: Order[], order: Order) {
  return sortOrders([ ...orders, order ]);
}

function removeOrder(orders: Order[], order: Order) {
  return orders.filter(o => o.key !== order.key);
}

function updateOrder(orders: Order[], order: Order) {
  return addOrder(removeOrder(orders, order), order);
}

export default function Orders() {
  const [ abortSignal, setAbortSignal ] = useState<AbortSignal>();

  useEffect(() => {
    const abortController = new AbortController();
    setAbortSignal(abortController.signal);
    return () => abortController.abort();
  }, []);

  const wallet = useContext(WalletContext);

  const [ tab, setTab ] = useState(OrdersTab.RECENT);
  const [ orders, setOrders ] = useState<Order[]>([]);
  const [ sending, setSending ] = useState(false);

  useEffect(() => {
    if (!wallet.connected) return;

    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    Operator.instance.addEventListener(OperatorEventType.ORDER_CREATED, ({ order }) => {
      switch (tab) {
        case OrdersTab.RECENT:
          setOrders(orders => addOrder(orders, order));
          break;

        case OrdersTab.OPEN:
          if (order.status.includes(OrderStatus.PENDING) || order.status.includes(OrderStatus.OPEN)) {
            setOrders(orders => addOrder(orders, order));
          }
          break;

        case OrdersTab.CLOSED:
          if (order.status.includes(OrderStatus.CLOSED)) {
            setOrders(orders => addOrder(orders, order));
          }
          break;
      }
    }, { signal: abortSignal });

    Operator.instance.addEventListener(OperatorEventType.ORDER_UPDATED, ({ order }) => {
      switch (tab) {
        case OrdersTab.RECENT:
          setOrders(orders => updateOrder(orders, order));
          break;

        case OrdersTab.OPEN:
          if (order.status.includes(OrderStatus.PENDING) || order.status.includes(OrderStatus.OPEN)) {
            setOrders(orders => updateOrder(orders, order));
          } else {
            setOrders(orders => removeOrder(orders, order));
          }
          break;

        case OrdersTab.CLOSED:
          if (order.status.includes(OrderStatus.CLOSED)) {
            setOrders(orders => updateOrder(orders, order));
          } else {
            setOrders(orders => removeOrder(orders, order));
          }
          break;
      }
    }, { signal: abortSignal });

    Operator.instance.addEventListener(OperatorEventType.ORDER_REMOVED, ({ order }) => {
      setOrders(orders => removeOrder(orders, order));
    }, { signal: abortSignal });

    setOrders([]);

    void (async () => {
      try {
        let orders: AsyncIterable<Order>;
        switch (tab) {
          case OrdersTab.RECENT:
            orders = Operator.instance.recentOrders(5, abortSignal);
            break;

          case OrdersTab.OPEN:
            orders = Operator.instance.openOrders(abortSignal);
            break;

          case OrdersTab.CLOSED:
            orders = Operator.instance.closedOrders(abortSignal);
            break;
        }
        for await (const order of orders) {
          setOrders(orders => orders.concat([ order ]));
        }

      } catch (error) {
        if (error !== abortSignal.reason) {
          // TODO handle other errors
          console.error(error);
        }
      }
    })();

    return () => abortController.abort();
  }, [ wallet, tab ]);

  const claim = useCallback((order: Order) => {
    if (!abortSignal) throw new Error('Abort signal has not been set');

    setSending(true);
    void (async () => {
      try {
        await Operator.instance.claimOrder(order, abortSignal);
        setSending(false);

      } catch (error) {
        if (error !== abortSignal.reason) {
          setSending(false);

          if (error instanceof RequestRejected) {
            // ignore

          } else {
            console.error(error);
          }
        }
      }
    })();
  }, [ abortSignal ]);

  const cancel = useCallback((order: Order) => {
    if (!abortSignal) throw new Error('Abort signal has not been set');

    setSending(true);
    void (async () => {
      try {
        await Operator.instance.cancelOrder(order, abortSignal);
        setSending(false);

      } catch (error) {
        if (error !== abortSignal.reason) {
          setSending(false);

          if (error instanceof RequestRejected) {
            // ignore

          } else {
            console.error(error);
          }
        }
      }
    })();
  }, [ abortSignal ]);

  const dismiss = useCallback((order: Order) => {
    if (!abortSignal) throw new Error('Abort signal has not been set');

    setSending(true);
    void (async () => {
      try {
        await Operator.instance.dismissOrder(order, abortSignal);
        setSending(false);

      } catch (error) {
        if (error !== abortSignal.reason) {
          setSending(false);
          console.error(error);
        }
      }
    })();
  }, [ abortSignal ]);

  return (
    <div className="orders-list">
      <Nav variant="tabs" activeKey={tab} onSelect={tab => setTab(tab as OrdersTab)}>
        <Nav.Link eventKey={OrdersTab.RECENT}>Recent Orders</Nav.Link>
        <Nav.Link eventKey={OrdersTab.OPEN}>Open Orders</Nav.Link>
        <Nav.Link eventKey={OrdersTab.CLOSED}>Closed Orders</Nav.Link>
      </Nav>
      <Table responsive hover>
        <thead>
          <tr>
            <th>Time</th>
            <th>Status</th>
            <th>Orderbook</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Executed</th>
            <th>Claimed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.key}>
              <td>{formatOrderTime(order)}</td>
              <td>{renderOrderStatus(order)}</td>
              <td>{formatOrderbook(order.orderbook)}</td>
              <td>
                {formatOrderExecutionType(order)}<br/>
                {formatOrderTradeType(order)
              }</td>
              <td>
                {formatOrderAmount(order)}<br />
                {formatOrderPrice(order)}
              </td>
              <td>
                {formatOrderExecuted(order)}<br />
                {formatOrderExecutedPrice(order)}
              </td>
              <td>
                {formatOrderClaimed(order)}<br />
                of {formatOrderFilled(order)}
              </td>
              <td>{renderOrderButtons(order, { claim, cancel, dismiss }, sending)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
