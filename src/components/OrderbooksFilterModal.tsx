import { OrderbookDEX, Token } from '@theorderbookdex/orderbook-dex-webapi';
import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

export interface OrderbooksFilter {
  tracked?: boolean;
  tradedToken?: Token;
  baseToken?: Token;
}

interface OrderbooksFilterModalProps {
  filter?: OrderbooksFilter;
  onChange?: (filter: OrderbooksFilter) => void;
  show?: boolean;
  onHide?: () => void;
}

export function OrderbooksFilterModal({ filter, onChange, show, onHide }: OrderbooksFilterModalProps) {
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

  const [ tracked, setTracked ] = useState(filter?.tracked);
  const [ tradedToken, setTradedToken ] = useState(filter?.tradedToken);
  const [ baseToken, setBaseToken ] = useState(filter?.baseToken);

  const cancel = useCallback(() => {
    setTracked(filter?.tracked);
    setTradedToken(filter?.tradedToken);
    setBaseToken(filter?.baseToken);
    onHide?.();
  }, [ filter, onHide ]);

  const search = useCallback(() => {
    onChange?.({ tracked, tradedToken, baseToken });
    onHide?.();
  }, [ onChange, onHide, tracked, tradedToken, baseToken ]);

  return (
    <Modal show={show} onHide={cancel}>
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title>Search</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form className="font-monospace">
          <Form.Check
            type="switch"
            id="tracked"
            checked={tracked}
            onChange={event => setTracked(event.target.checked)}
            label="Only ★"
            className="mb-3"
          />

          <Form.Group controlId="tradedToken" className="mb-3">
            <Form.Label>Traded Token</Form.Label>
            <Form.Select
              value={tradedToken?.address}
              onChange={event => setTradedToken(tokens?.get(event.target.value))}
            >
              {tokens ?
                <>
                  <option value="">Any token</option>
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

          <Form.Group controlId="baseToken" className="mb-3">
            <Form.Label>Base Token</Form.Label>
            <Form.Select
              value={baseToken?.address}
              onChange={event => setBaseToken(tokens?.get(event.target.value))}
            >
              {tokens ?
                <>
                  <option value="">Any token</option>
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
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="font-monospace text-uppercase" onClick={cancel}>Cancel</Button>
        <Button variant="success" className="font-monospace text-uppercase" onClick={search}>Search</Button>
      </Modal.Footer>
    </Modal>
  );
}
