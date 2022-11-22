import { Token, OrderbookDEX, RequestRejected, Operator } from '@theorderbookdex/orderbook-dex-webapi';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Col, Form, InputGroup, Spinner } from 'react-bootstrap';

enum Feedback {
  NONE,
  SENDING,
  SUCCESS,
  UNEXPECTED_ERROR,
}

export default function CreateOrderbookPage() {
  const [ tokens, setTokens ] = useState<Map<string, Token>>();

  useEffect(() => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    void (async () => {
      try {
        const tokens = new Map<string, Token>();
        for await (const token of OrderbookDEX.instance.getTokens(abortSignal)) {
          tokens.set(token.address, token);
        }
        setTokens(tokens);

      } catch (error) {
        if (error !== abortSignal.reason) {
          // TODO handle other errors
          console.error(error);
        }
      }
    })();

    return () => abortController.abort();
  }, []);

  const [ validated, setValidated ] = useState(false);
  const [ sending, setSending ] = useState(false);
  const [ feedback, setFeedback ] = useState(Feedback.NONE);
  const [ tradedToken, setTradedToken ] = useState<Token>();
  const [ baseToken, setBaseToken ] = useState<Token>();
  const [ contractSize, setContractSize ] = useState('');
  const [ priceTick, setPriceTick ] = useState('');

  const submit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();

    if (form.checkValidity()) {
      if (!tradedToken) throw new Error('traded token should have been validated');
      if (!baseToken) throw new Error('base token should have been validated');

      setSending(true);
      setValidated(false);
      setFeedback(Feedback.SENDING);

      void (async () => {
        try {
          const actualContractSize = tradedToken.parseAmount(contractSize);
          const actualPriceTick = baseToken.parseAmount(priceTick) * actualContractSize / tradedToken.unit;

          const orderbook = await Operator.instance.createOrderbook({
            tradedToken,
            baseToken,
            contractSize: actualContractSize,
            priceTick: actualPriceTick,
          });

          await OrderbookDEX.instance.trackOrderbook(orderbook);

          setTradedToken(undefined);
          setBaseToken(undefined);
          setContractSize('');
          setPriceTick('');

          setSending(false);
          setValidated(false);
          setFeedback(Feedback.SUCCESS);

        } catch (error) {
          setSending(false);
          if (error instanceof RequestRejected) {
            setFeedback(Feedback.NONE);

          } else {
            console.error(error);
            setFeedback(Feedback.UNEXPECTED_ERROR);
          }
        }
      })();

    } else {
      setValidated(true);
      setFeedback(Feedback.NONE);
    }
  }, [ tradedToken, baseToken, contractSize, priceTick ]);

  return (
    <Form noValidate validated={validated} onSubmit={submit} className="row g-0 align-content-start font-monospace">
      <Col lg={4} className="p-3">
        <Form.Group controlId="version">
          <Form.Label>Version</Form.Label>
          <Form.Select
            required
            disabled={sending}
          >
            <option value="10000">V1</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            Please select a version.
          </Form.Control.Feedback>
        </Form.Group>
      </Col>

      <Col lg={4} className="p-3">
        <Form.Group controlId="tradedToken">
          <Form.Label>Traded Token</Form.Label>
          <Form.Select
            required
            disabled={sending}
            value={tradedToken?.address}
            onChange={event => setTradedToken(tokens?.get(event.target.value))}
          >
            {tokens ?
              <>
                <option value="">Select a token</option>
                {[...tokens.values()].map(token =>
                  <option
                    key={token.address}
                    value={token.address}
                    disabled={token.address === baseToken?.address}
                  >{token.symbol}</option>
                )}
              </>
            :
              <option value="">Loading tokens...</option>
            }
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            Please select a traded token.
          </Form.Control.Feedback>
        </Form.Group>
      </Col>

      <Col lg={4} className="p-3">
        <Form.Group controlId="baseToken">
          <Form.Label>Base Token</Form.Label>
          <Form.Select
            required
            disabled={sending}
            value={baseToken?.address}
            onChange={event => setBaseToken(tokens?.get(event.target.value))}
          >
            {tokens ?
              <>
                <option value="">Select a token</option>
                {[...tokens.values()].map(token =>
                  <option
                    key={token.address}
                    value={token.address}
                    disabled={token.address === tradedToken?.address}
                  >{token.symbol}</option>
                )}
              </>
            :
              <option value="">Loading tokens...</option>
            }
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            Please select a base token.
          </Form.Control.Feedback>
        </Form.Group>
      </Col>

      <Col lg={4} className="p-3">
        <Form.Group controlId="contractSize">
          <Form.Label>Contract Size</Form.Label>
          <InputGroup hasValidation>
            <Form.Control
              className="text-end"
              placeholder="0.0"
              type="number"
              required
              disabled={!tradedToken}
              readOnly={sending}
              min={tradedToken?.formatAmount(1n)}
              step={tradedToken?.formatAmount(1n)}
              value={contractSize}
              onChange={event => setContractSize(event.target.value)} />
            <InputGroup.Text>{tradedToken?.symbol}</InputGroup.Text>
            <Form.Control.Feedback type="invalid">
              Please enter a valid contract size.
            </Form.Control.Feedback>
          </InputGroup>
        </Form.Group>
      </Col>

      <Col lg={4} className="p-3">
        <Form.Group controlId="priceTick">
          <Form.Label>Price Tick</Form.Label>
          <InputGroup hasValidation>
            <Form.Control
              className="text-end"
              placeholder="0.0"
              type="number"
              required
              disabled={!baseToken}
              readOnly={sending}
              min={baseToken?.formatAmount(1n)}
              step={baseToken?.formatAmount(1n)}
              value={priceTick}
              onChange={event => setPriceTick(event.target.value)} />
            <InputGroup.Text>{baseToken?.symbol}</InputGroup.Text>
            <Form.Control.Feedback type="invalid">
              Please enter a valid price tick.
            </Form.Control.Feedback>
          </InputGroup>
        </Form.Group>
      </Col>

      <Col lg={4} />
      <Col lg={4} />

      <Col lg={4} className="p-3">
        { feedback === Feedback.SENDING ?
          <Alert variant="primary" className="mb-3 font-monospace">
            <Spinner animation="border" size="sm" className="me-1" /> Creating orderbook...
          </Alert>

        : feedback === Feedback.SUCCESS ?
          <Alert variant="success" className="mb-3 font-monospace">Orderbook created</Alert>

        : feedback === Feedback.UNEXPECTED_ERROR ?
          <Alert variant="danger" className="mb-3 font-monospace">An unexpected error has occurred</Alert>

        :
          <></>
        }
        <div className="text-center">
          <Button variant="success" className="w-100 font-monospace text-uppercase" type="submit" disabled={sending}>Create Orderbook</Button>
        </div>
      </Col>
    </Form>
  );
}
