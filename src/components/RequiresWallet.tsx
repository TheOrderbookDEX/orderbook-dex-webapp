import { PropsWithChildren, useCallback, useContext } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext';

export default function RequiresWallet({ children }: PropsWithChildren<{}>) {
  const { connecting, connected, connect } = useContext(WalletContext);
  const navigate = useNavigate();

  const close = useCallback(() => {
    navigate('/');
  }, [ navigate ]);

  if (connected) {
    return (
      <>
        {children}
      </>
    );

  } else if (connecting) {
    return (
      <Spinner animation="border" className="m-auto align-self-center" />
    );

  } else {
    return (
      <Modal show onHide={close}>
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Wallet Connection Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>A connection to a wallet is required to continue. </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close}>Close</Button>
          <Button variant="primary" onClick={connect}>Connect</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
