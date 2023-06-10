import { Operator as OperatorAPI, OperatorNotCreated, RequestRejected, WalletAddressNotFound } from '@theorderbookdex/orderbook-dex-webapi';
import { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

interface WalletState {
  connecting: boolean;
  connected: boolean;
}

export interface Wallet extends WalletState {
  connect(): void;
}

export const WalletContext = createContext<Readonly<Wallet>>({
  connecting: false,
  connected: false,
  connect() {},
});

enum Feedback {
  NONE,
  REGISTER_REQUIRED,
  ADDRESS_MISSING,
  UNEXPECTED_ERROR,
}

export function WalletProvider({ children }: PropsWithChildren<{}>) {
  const [ feedback, setFeedback ] = useState(Feedback.NONE);

  const [ walletState, setWalletState ] = useState<WalletState>({
    connecting: false,
    connected: false,
  });

  const wallet = useMemo<Wallet>(() => ({
    ...walletState,
    async connect() {
      try {
        setWalletState(state => ({ ...state, connecting: true }));
        await OperatorAPI.connect();
        setWalletState(state => ({ ...state, connecting: false, connected: true }));

      } catch (error) {
        if (error instanceof OperatorNotCreated) {
          setWalletState(state => ({ ...state, connecting: false }));
          setFeedback(Feedback.REGISTER_REQUIRED);

        } else {
          setWalletState(state => ({ ...state, connecting: false }));
          if (error instanceof RequestRejected) {
            // ignore error

          } else if (error instanceof WalletAddressNotFound) {
            setFeedback(Feedback.ADDRESS_MISSING);

          } else {
            console.error(error);
            setFeedback(Feedback.UNEXPECTED_ERROR);
          }
        }
      }
    },
  }), [ walletState ]);

  const hideFeedback = useCallback(() => {
    setFeedback(Feedback.NONE);
  }, []);

  const register = useCallback(() => {
    void (async () => {
      try {
        setFeedback(Feedback.NONE);
        setWalletState(state => ({ ...state, connecting: true }));
        await OperatorAPI.create();
        setWalletState(state => ({ ...state, connecting: false, connected: true }));

      } catch (error) {
        setWalletState(state => ({ ...state, connecting: false }));
        if (error instanceof RequestRejected) {
          // ignore error

        } else if (error instanceof WalletAddressNotFound) {
          setFeedback(Feedback.ADDRESS_MISSING);

        } else {
          console.error(error);
          setFeedback(Feedback.UNEXPECTED_ERROR);
        }
      }
    })();
  }, []);

  useEffect(() => {
    void (async function() {
      try {
        setWalletState(state => ({ ...state, connecting: true }));
        await OperatorAPI.connect(false);
        setWalletState(state => ({ ...state, connecting: false, connected: true }));

      } catch (error) {
        setWalletState(state => ({ ...state, connecting: false }));
        // ignore error
      }
    })();
  }, []);

  return (
    <>
      <WalletContext.Provider value={wallet}>
        {children}
      </WalletContext.Provider>

      <Modal show={feedback === Feedback.REGISTER_REQUIRED} onHide={hideFeedback}>
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>You don't have an Operator</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>The Orderbook DEX app requires you to deploy an Operator smart contract which operates on your behalf and you solely own.</p>
          <p>
            It acts as a wallet where you deposit the funds you wish to trade with. You can read more about this in
            the <a href="https://orderbookdex.com/wp-content/uploads/whitepaper.pdf" rel="noreferrer" target="_blank">whitepaper</a>.
          </p>
          <p>If you continue you'll be asked to sign the transaction creating your Operator.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={hideFeedback}>Cancel</Button>
          <Button variant="primary" onClick={register}>Continue</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={feedback === Feedback.ADDRESS_MISSING} onHide={hideFeedback}>
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>An address for your wallet was not provided.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={hideFeedback}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={feedback === Feedback.UNEXPECTED_ERROR} onHide={hideFeedback}>
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>An unexpected error has happened while trying to create your operator.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={hideFeedback}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export const WalletConsumer = WalletContext.Consumer;
