import { InsufficientFunds, Operator, RequestRejected } from '@theorderbookdex/orderbook-dex-webapi';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { TokenWithBalance } from './OperatorPage';

enum Feedback {
  NONE,
  SENDING,
  SUCCESS,
  INSUFFICIENT_FUNDS,
  UNEXPECTED_ERROR,
}

interface OperatorTokenDepositFormProps {
  token: TokenWithBalance;
  onCancel: () => void;
}

export default function OperatorTokenWithdrawForm({ token, onCancel }: OperatorTokenDepositFormProps) {
  const [ abortSignal, setAbortSignal ] = useState<AbortSignal>();

  useEffect(() => {
    const abortController = new AbortController();
    setAbortSignal(abortController.signal);
    return () => abortController.abort();
  }, [ token ]);

  const [ validated, setValidated ] = useState(false);
  const [ amount, setAmount ] = useState('');
  const [ sending, setSending ] = useState(false);
  const [ feedback, setFeedback ] = useState(Feedback.NONE);

  const submit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    if (!abortSignal) throw new Error('Abort signal has not been set');

    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    if (form.checkValidity()) {
      setSending(true);
      setValidated(false);
      setFeedback(Feedback.SENDING);
      void (async () => {
        try {
          await Operator.instance.withdraw(token.data, token.data.parseAmount(amount), abortSignal);
          setSending(false);
          setAmount('');
          setValidated(false);
          setFeedback(Feedback.SUCCESS);
        } catch (error) {
          if (error !== abortSignal.reason) {
            setSending(false);
            if (error instanceof RequestRejected) {
              setFeedback(Feedback.NONE);
            } else if (error instanceof InsufficientFunds) {
              setFeedback(Feedback.INSUFFICIENT_FUNDS);
            } else {
              console.error(error);
              setFeedback(Feedback.UNEXPECTED_ERROR);
            }
          }
        }
      })();
    } else {
      setValidated(true);
      setFeedback(Feedback.NONE);
    }
  }, [ token, abortSignal, amount ]);

  return (
    <>
      { feedback === Feedback.SENDING ?
        <Alert variant="primary" className="m-3 font-monospace">
          <Spinner animation="border" size="sm" className="me-1" /> Withdrawing tokens...
        </Alert>

      : feedback === Feedback.SUCCESS ?
        <Alert variant="success" className="m-3 font-monospace">Tokens successfully withdrawn</Alert>

      : feedback === Feedback.INSUFFICIENT_FUNDS ?
        <Alert variant="danger" className="m-3 font-monospace">Operator does not have the amount of tokens requested</Alert>

      : feedback === Feedback.UNEXPECTED_ERROR ?
        <Alert variant="danger" className="m-3 font-monospace">An unexpected error has occurred</Alert>

      :
        <></>
      }
      <Form noValidate validated={validated} onSubmit={submit} className="font-monospace">
        <Form.Group className="m-3" controlId="amount">
          <Form.Label>Amount</Form.Label>
          <Form.Control type="number" required
            min={token.data.formatAmount(1n)}
            step={token.data.formatAmount(1n)}
            value={amount} onChange={event => setAmount(event.target.value)}
            readOnly={sending} placeholder="Enter amount to withdraw" />
          <Form.Control.Feedback type="invalid">
            Please enter a valid amount.
          </Form.Control.Feedback>
        </Form.Group>
        <div className="m-3">
          <Button variant="danger" className="font-monospace text-uppercase" onClick={onCancel} disabled={sending}>Cancel</Button>
          <Button variant="success" className="ms-3 font-monospace text-uppercase" type="submit" disabled={sending}>Withdraw</Button>
        </div>
      </Form>
    </>
  );
}
