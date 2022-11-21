import { Chain, OrderbookDEX, Operator } from '@theorderbookdex/orderbook-dex-webapi';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';

enum Message {
  STARTUP = 'startup',
}

export default function SingleInstanceMutex({ children }: PropsWithChildren<{}>) {
  const [ lockedOut, setLockedOut ] = useState(false);

  useEffect(() => {
    const broadcastChannel = new BroadcastChannel('The Orderbook DEX App');

    broadcastChannel.postMessage(Message.STARTUP);

    broadcastChannel.addEventListener('message', event => {
      if (event.data === Message.STARTUP) {
        setLockedOut(true);
        try { Operator.disconnect();     } catch (error) { console.error(error); }
        try { OrderbookDEX.disconnect(); } catch (error) { console.error(error); }
        try { Chain.disconnect();        } catch (error) { console.error(error); }
      }
    });

    return () => broadcastChannel.close();
  }, []);

  if (lockedOut) {
    return (
      <Modal show backdrop="static">
        <Modal.Header>
          <Modal.Title>Sorry, the app can only run in one window/tab</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Currently the app can only run in one window/tab, since all instances share the same client side data, race conditions might end up corrupting the stored data.</p>
          <p>Furthermore, each instance of the app would be independently connecting to the endpoint RPC of your ethereum provider, taxing it more than necessary.</p>
          <p>This could be solved in the future, but it's not a priority right now.</p>
          <p>Please continue using the app in the other window/tab.</p>
        </Modal.Body>
      </Modal>
    );
  } else {
    return <>{children}</>;
  }
}
