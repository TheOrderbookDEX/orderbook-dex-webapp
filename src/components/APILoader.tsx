import { Chain, ChainNotSupported, OrderbookDEX } from '@theorderbookdex/orderbook-dex-webapi';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Modal, Spinner } from 'react-bootstrap';

enum Feedback {
  NONE,
  CHAIN_NOT_SUPPORTED,
  UNEXPECTED_ERROR,
}

export default function APILoader({ children }: PropsWithChildren<{}>) {
  const [ ready, setReady ] = useState(false);
  const [ feedback, setFeedback ] = useState(Feedback.NONE);

  useEffect(() => {
    setReady(false);

    void (async function() {
      try {
        await Chain.connect();
        await OrderbookDEX.connect();
        setReady(true);

      } catch (error) {
        if (error instanceof ChainNotSupported) {
          setFeedback(Feedback.CHAIN_NOT_SUPPORTED);

        } else {
          // TODO handle other errors
          console.error(error);
          setFeedback(Feedback.UNEXPECTED_ERROR);
        }
      }
    })();
  }, []);

  return (
    <>
      { ready ?
        children

      : feedback === Feedback.CHAIN_NOT_SUPPORTED ?
        <Modal show>
          <Modal.Header>
            <Modal.Title>Please change your network</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><em>The Orderbook DEX</em> currently supports the following chains:</p>
            <ul style={{ padding: 'revert', margin: 'revert', listStyle: 'revert' }}>
              <li>Goerli Testnet</li>
            </ul>
          </Modal.Body>
        </Modal>

      : feedback === Feedback.UNEXPECTED_ERROR ?
        <Modal show>
          <Modal.Header>
            <Modal.Title>Error</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            An unexpected error has happened while loading up the app.
          </Modal.Body>
        </Modal>

      :
        <div className="container d-flex vh-100 justify-content-center">
          <div className="row align-self-center">
            <Spinner animation="border" />
          </div>
        </div>
      }
    </>
  );
}
