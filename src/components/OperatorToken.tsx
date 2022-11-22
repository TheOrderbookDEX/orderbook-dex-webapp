import { OrderbookDEX, RequestRejected } from '@theorderbookdex/orderbook-dex-webapi';
import { FaucetOnCooldown, Operator } from '@theorderbookdex/orderbook-dex-webapi/dist/Operator';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Col, Row, Spinner } from 'react-bootstrap';
import { TokenWithBalance } from './OperatorPage';
import OperatorTokenDepositForm from './OperatorTokenDepositForm';
import OperatorTokenWithdrawForm from './OperatorTokenWithdrawForm';

enum FaucetStatus {
  INITIAL,
  SENDING,
  SUCCESS,
  ON_COOLDOWN,
  UNEXPECTED_ERROR,
}

enum ManageFundsStatus {
  INITIAL,
  DEPOSIT,
  WITHDRAW,
}

enum RemoveStatus {
  INITIAL,
  CONFIRM,
  REMOVING,
  REMOVED
}

export default function OperatorToken({ token }: { token: TokenWithBalance }) {
  const [ abortSignal, setAbortSignal ] = useState<AbortSignal>();

  useEffect(() => {
    const abortController = new AbortController();
    setAbortSignal(abortController.signal);
    return () => abortController.abort();
  }, [ token ]);

  const [ faucetStatus, setFaucetStatus ] = useState(FaucetStatus.INITIAL);
  const [ manageFundsStatus, setManageFundsStatus ] = useState(ManageFundsStatus.INITIAL);
  const [ removeStatus, setRemoveStatus ] = useState(RemoveStatus.INITIAL);

  useEffect(() => {
    setFaucetStatus(FaucetStatus.INITIAL);
    setManageFundsStatus(ManageFundsStatus.INITIAL);
    setRemoveStatus(RemoveStatus.INITIAL);
  }, [ token ]);

  const requestTokens = useCallback(() => {
    if (!abortSignal) throw new Error('Abort signal has not been set');

    setFaucetStatus(FaucetStatus.SENDING);

    void (async () => {
      try {
        await Operator.instance.faucet(token.data, abortSignal);
        setFaucetStatus(FaucetStatus.SUCCESS);

      } catch (error) {
        if (error !== abortSignal.reason) {
          if (error instanceof RequestRejected) {
            setFaucetStatus(FaucetStatus.INITIAL);

          } else if (error instanceof FaucetOnCooldown) {
            setFaucetStatus(FaucetStatus.ON_COOLDOWN);

          } else {
            console.error(error);
            setFaucetStatus(FaucetStatus.UNEXPECTED_ERROR);
          }
        }
      }
    })();
  }, [ abortSignal, token ])

  const removeToken = useCallback(() => {
    if (!abortSignal) throw new Error('Abort signal has not been set');

    setRemoveStatus(RemoveStatus.REMOVING);

    void (async () => {
      try {
        await OrderbookDEX.instance.forgetToken(token.data, abortSignal);
        setRemoveStatus(RemoveStatus.REMOVED);

      } catch (error) {
        if (error !== abortSignal.reason) {
          // TODO handle other errors
          console.error(error);
        }
      }
    })();
  }, [ abortSignal, token ]);

  return (
    <div>
      <h2 className="p-3 m-0 bg-secondary">{token.data.name} ({token.data.symbol})</h2>

      <div className="font-monospace text-nowrap fs-5">
        <Row className="g-0 border-bottom">
          <Col xs={4} className="p-3">Operator Balance</Col>
          <Col xs={8} className="p-3 text-end">{token.data.formatAmount(token.balance.operator)} {token.data.symbol}</Col>
        </Row>
        <Row className="g-0 border-bottom">
          <Col xs={4} className="p-3">Wallet Balance</Col>
          <Col xs={8} className="p-3 text-end">{token.data.formatAmount(token.balance.wallet)} {token.data.symbol}</Col>
        </Row>
        <Row className="g-0 border-bottom">
          <Col xs={4} className="p-3">Token Address</Col>
          <Col xs={8} className="p-3 text-end">{token.data.address}</Col>
        </Row>
      </div>

      {token.data.hasFaucet ?
        <>
          <h3 className="p-3 m-0 bg-secondary">Faucet</h3>
          <div className="m-3">
            { faucetStatus === FaucetStatus.SENDING ?
              <Alert variant="primary" className="font-monospace">
                <Spinner animation="border" size="sm" className="me-1" /> Requesting {token.data.symbol}...
              </Alert>

            : faucetStatus === FaucetStatus.SUCCESS ?
              <Alert variant="success" className="font-monospace">Tokens successfully requested</Alert>

            : faucetStatus === FaucetStatus.ON_COOLDOWN ?
              <Alert variant="warning" className="font-monospace">Faucet called again too soon, try again later</Alert>

            : faucetStatus === FaucetStatus.UNEXPECTED_ERROR ?
              <Alert variant="danger" className="font-monospace">An unexpected error has occurred</Alert>

            :
              <Button variant="success" className="font-monospace text-uppercase" onClick={requestTokens}>Send me {token.data.symbol}</Button>
            }
          </div>
        </>
      : <></>}

      {manageFundsStatus === ManageFundsStatus.DEPOSIT ?
        <>
          <h3 className="p-3 m-0 bg-secondary">Deposit</h3>
          <OperatorTokenDepositForm token={token}
            onCancel={() => setManageFundsStatus(ManageFundsStatus.INITIAL)} />
        </>

      : manageFundsStatus === ManageFundsStatus.WITHDRAW ?
        <>
          <h3 className="p-3 m-0 bg-secondary">Withdraw</h3>
          <OperatorTokenWithdrawForm token={token}
            onCancel={() => setManageFundsStatus(ManageFundsStatus.INITIAL)} />
        </>

      :
        <>
          <h3 className="p-3 m-0 bg-secondary">Manage Funds</h3>
          <div className="m-3">
            <Button variant="success" className="font-monospace text-uppercase" onClick={() => setManageFundsStatus(ManageFundsStatus.DEPOSIT)}>Deposit</Button>
            <Button variant="danger" className="ms-3 font-monospace text-uppercase" onClick={() => setManageFundsStatus(ManageFundsStatus.WITHDRAW)}>Withdraw</Button>
          </div>
        </>
      }

      {removeStatus === RemoveStatus.REMOVED ?
        <>
          <h3 className="p-3 m-0 bg-secondary">Removing token...</h3>
          Token removed
        </>

      : removeStatus === RemoveStatus.REMOVING ?
        <>
          <h3 className="p-3 m-0 bg-secondary">Removing token...</h3>
          <Spinner animation="border" />
        </>

      : removeStatus === RemoveStatus.CONFIRM ?
        <>
          <h3 className="p-3 m-0 bg-secondary">Are you sure you want to remove this token?</h3>
          <div className="m-3">
            <Button variant="success" className="font-monospace text-uppercase" onClick={() => setRemoveStatus(RemoveStatus.INITIAL)}>Cancel</Button>
            <Button variant="danger" className="ms-3 font-monospace text-uppercase" onClick={removeToken}>Remove</Button>
          </div>
        </>

      :
        <>
          <h3 className="p-3 m-0 bg-secondary">Remove Token</h3>
          <div className="m-3">
            <Button variant="danger" className="font-monospace text-uppercase" onClick={() => setRemoveStatus(RemoveStatus.CONFIRM)}>Remove</Button>
          </div>
        </>
      }
    </div>
  );
}
