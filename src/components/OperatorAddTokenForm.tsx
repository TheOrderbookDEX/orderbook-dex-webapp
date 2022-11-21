import { Address, NotAnERC20Token, OrderbookDEX } from '@theorderbookdex/orderbook-dex-webapi';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap'

enum Feedback {
  NONE,
  SAVING,
  SUCCESS,
  NOT_AN_ERC20_TOKEN,
  UNEXPECTED_ERROR,
}

export default function OperatorAddTokenForm() {
  const [ abortSignal, setAbortSignal ] = useState<AbortSignal>();

  useEffect(() => {
    const abortController = new AbortController();
    setAbortSignal(abortController.signal);
    return () => abortController.abort();
  }, []);

  const [ validated, setValidated ] = useState(false);
  const [ tokenAddress, setTokenAddress ] = useState('');
  const [ saving, setSaving ] = useState(false);
  const [ feedback, setFeedback ] = useState(Feedback.NONE);

  const submit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    if (!abortSignal) throw new Error('Abort signal has not been set');

    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    if (form.checkValidity()) {
      setSaving(true);
      setValidated(false);
      setFeedback(Feedback.SAVING);
      void (async () => {
        try {
          const token = await OrderbookDEX.instance.getToken(tokenAddress as Address, abortSignal);
          // TODO preview token info before adding
          await OrderbookDEX.instance.trackToken(token, abortSignal);
          setSaving(false);
          setTokenAddress('');
          setValidated(false);
          setFeedback(Feedback.SUCCESS);
        } catch (error) {
          if (error !== abortSignal.reason) {
            setSaving(false);
            if (error instanceof NotAnERC20Token) {
              setFeedback(Feedback.NOT_AN_ERC20_TOKEN);
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
  }, [ abortSignal, tokenAddress ]);

  return (
    <div>
      <h2 className="p-3 m-0 bg-secondary">Add Token</h2>
      { feedback === Feedback.SAVING ?
        <Alert variant="primary" className="m-3 font-monospace">
          <Spinner animation="border" size="sm" className="me-1" /> Adding token...
        </Alert>

      : feedback === Feedback.SUCCESS ?
        <Alert variant="success" className="m-3 font-monospace">Token successfully added</Alert>

      : feedback === Feedback.NOT_AN_ERC20_TOKEN ?
        <Alert variant="danger" className="m-3 font-monospace">The provided address does not seem to be an ERC20 token</Alert>

      : feedback === Feedback.UNEXPECTED_ERROR ?
        <Alert variant="danger" className="m-3 font-monospace">An unexpected error has occurred</Alert>

      :
        <></>
      }
      <Form noValidate validated={validated} onSubmit={submit} className="font-monospace">
        <Form.Group className="m-3" controlId="tokenAddress">
          <Form.Label>Token address</Form.Label>
          <Form.Control type="text" required pattern="0x[0-9a-fA-F]{40}" placeholder="Enter token address"
            value={tokenAddress} onChange={ event => setTokenAddress(event.target.value) }
            readOnly={saving} />
          <Form.Control.Feedback type="invalid">
            Please enter a valid token address.
          </Form.Control.Feedback>
        </Form.Group>
        <div className="m-3">
          <Button variant="success" className="font-monospace text-uppercase" type="submit" disabled={saving}>Add Token</Button>
        </div>
      </Form>
    </div>
  );
}
