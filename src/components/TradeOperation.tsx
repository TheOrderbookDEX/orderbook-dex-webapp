import './TradeOperation.scss';
import { InsufficientFunds, OperationRejected, Orderbook, Wallet, WalletNotConnected } from '@theorderbookdex/orderbook-dex-webapi';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, InputGroup, Nav, Spinner } from 'react-bootstrap';
import { formatContractSize, formatPriceTick, parseContractAmount, parsePrice } from '../utils/format';

enum OrderType {
  LIMIT = 'limit',
  MARKET = 'market',
}

enum TradeType {
  BUY = 'buy',
  SELL = 'sell',
}

enum Feedback {
  NONE,
  PLACING_ORDER,
  ORDER_SENT,
  WALLET_NOT_CONNECTED,
  INSUFFICIENT_OPERATOR_FUNDS,
  DEPOSITING_FUNDS,
  FUNDS_DEPOSITED,
  INSUFFICIENT_WALLET_FUNDS,
  UNEXPECTED_ERROR,
}

interface TradeOperationProps {
  orderbook: Orderbook;
}

export default function TradeOperation({ orderbook }: TradeOperationProps) {
  const [ abortSignal, setAbortSignal ] = useState<AbortSignal>();

  useEffect(() => {
    const abortController = new AbortController();
    setAbortSignal(abortController.signal);
    return () => abortController.abort();
  }, [ orderbook ]);

  const tradedToken = useMemo(() => orderbook.tradedToken, [ orderbook ]);
  const baseToken = useMemo(() => orderbook.baseToken, [ orderbook ]);

  const [ orderType, setOrderType ] = useState(OrderType.LIMIT);
  const [ tradeType, setTradeType ] = useState(TradeType.BUY);
  const [ amount, setAmount ] = useState('');
  const [ price, setPrice ] = useState('');
  const [ validated, setValidated ] = useState(false);
  const [ sending, setSending ] = useState(false);
  const [ feedback, setFeedback ] = useState(Feedback.NONE);

  useEffect(() => {
    setAmount('');
    setPrice('');
    setValidated(false);
    setSending(false);
    setFeedback(Feedback.NONE);
  }, [ orderbook ]);

  const submit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    if (!abortSignal) throw new Error('Abort signal has not been set');

    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();

    if (form.checkValidity()) {
      setSending(true);
      setValidated(false);
      setFeedback(Feedback.PLACING_ORDER);

      void (async () => {
        try {
          const orderAmount = parseContractAmount(orderbook, amount);
          const orderPrice = parsePrice(orderbook, price);
          switch (orderType) {
            case OrderType.LIMIT:
              switch (tradeType) {
                case TradeType.BUY:
                  await Wallet.instance.placeBuyOrder(orderbook, orderAmount, orderPrice, abortSignal);
                  break;
                case TradeType.SELL:
                  await Wallet.instance.placeSellOrder(orderbook, orderAmount, orderPrice, abortSignal);
                  break;
              }
              break;
            case OrderType.MARKET:
              switch (tradeType) {
                case TradeType.BUY:
                  await Wallet.instance.buyAtMarket(orderbook, orderAmount, orderPrice, abortSignal);
                  break;
                case TradeType.SELL:
                  await Wallet.instance.sellAtMarket(orderbook, orderAmount, orderPrice, abortSignal);
                  break;
              }
              break;
          }
          setSending(false);
          setAmount('');
          setPrice('');
          setFeedback(Feedback.ORDER_SENT);

        } catch (error) {
          if (error !== abortSignal.reason) {
            setSending(false);

            if (error instanceof OperationRejected) {
              setFeedback(Feedback.NONE);

            } else if (error instanceof WalletNotConnected) {
              setFeedback(Feedback.WALLET_NOT_CONNECTED);

            } else if (error instanceof InsufficientFunds) {
              setFeedback(Feedback.INSUFFICIENT_OPERATOR_FUNDS);

            } else {
              console.error(error);
              setFeedback(Feedback.UNEXPECTED_ERROR)
            }
          }
        }
      })();
    } else {
      setValidated(true);
      setFeedback(Feedback.NONE);
    }
  }, [ abortSignal, orderbook, orderType, tradeType, amount, price ]);

  const totalPrice = useMemo(() => {
    if (amount === '' || price === '') return '';
    return baseToken.formatAmount(tradedToken.parseAmount(amount) * baseToken.parseAmount(price) / tradedToken.unit);
  }, [ amount, price, tradedToken, baseToken ]);

  const contractSize = useMemo(() => formatContractSize(orderbook), [ orderbook ]);
  const priceTick = useMemo(() => formatPriceTick(orderbook), [ orderbook ]);

  const depositMissingFunds = useCallback(() => {
    if (!abortSignal) throw new Error('Abort signal has not been set');

    setSending(true);
    setFeedback(Feedback.DEPOSITING_FUNDS);

    void (async () => {
      try {
        const { tradedToken, baseToken } = orderbook;
        switch (tradeType) {
          case TradeType.BUY: {
            const requiredAmount = tradedToken.parseAmount(amount) * baseToken.parseAmount(price) / tradedToken.unit;
            const missingAmount = requiredAmount - (await Wallet.instance.getBalance(baseToken, abortSignal)).operator;
            if (missingAmount > 0n) {
              await Wallet.instance.deposit(baseToken, missingAmount, abortSignal);
            }
            break;
          }
          case TradeType.SELL: {
            const requiredAmount = tradedToken.parseAmount(amount);
            const missingAmount = requiredAmount - (await Wallet.instance.getBalance(tradedToken, abortSignal)).operator;
            if (missingAmount > 0n) {
              await Wallet.instance.deposit(tradedToken, missingAmount, abortSignal);
            }
            break;
          }
        }
        setSending(false);
        setFeedback(Feedback.FUNDS_DEPOSITED);

      } catch (error) {
        if (error !== abortSignal.reason) {
          setSending(false);

          if (error instanceof OperationRejected) {
            setFeedback(Feedback.NONE);

          } else if (error instanceof WalletNotConnected) {
            setFeedback(Feedback.WALLET_NOT_CONNECTED);

            } else if (error instanceof InsufficientFunds) {
              setFeedback(Feedback.INSUFFICIENT_WALLET_FUNDS);

          } else {
            console.error(error);
            setFeedback(Feedback.UNEXPECTED_ERROR)
          }
        }
      }
    })();
  }, [ abortSignal, orderbook, amount, price, tradeType ]);

  return (
    <div className="trade-operation">
      <Nav activeKey={orderType} onSelect={(orderType) => setOrderType(orderType as OrderType)}>
        <Nav.Link eventKey={OrderType.LIMIT} disabled={sending}>Limit</Nav.Link>
        <Nav.Link eventKey={OrderType.MARKET} disabled={sending}>Market</Nav.Link>
      </Nav>
      <Nav activeKey={tradeType} onSelect={(tradeType) => setTradeType(tradeType as TradeType)}>
        <Nav.Link eventKey={TradeType.BUY} disabled={sending}>Buy</Nav.Link>
        <Nav.Link eventKey={TradeType.SELL} disabled={sending}>Sell</Nav.Link>
      </Nav>
      <Form noValidate validated={validated} onSubmit={submit}>
        <InputGroup hasValidation>
          <InputGroup.Text>Amount:</InputGroup.Text>
          <Form.Control type="number" required readOnly={sending}
            min={contractSize}
            step={contractSize}
            value={amount} onChange={event => setAmount(event.target.value)} />
          <InputGroup.Text>{tradedToken.symbol}</InputGroup.Text>
          <Form.Control.Feedback type="invalid">
            Please enter a valid amount. Amount must be a multiple of contract size.
          </Form.Control.Feedback>
        </InputGroup>
        <InputGroup hasValidation>
          <InputGroup.Text>
            { orderType === OrderType.LIMIT ?
              <>Price:</>
            : tradeType === TradeType.BUY ?
              <>Max price:</>
            :
              <>Min price:</>
            }
          </InputGroup.Text>
          <Form.Control type="number" required readOnly={sending}
            min={priceTick}
            step={priceTick}
            value={price} onChange={event => setPrice(event.target.value)} />
          <InputGroup.Text>{baseToken.symbol}</InputGroup.Text>
          <Form.Control.Feedback type="invalid">
            Please enter a valid price. Price must be a multiple of price tick.
          </Form.Control.Feedback>
        </InputGroup>
        <InputGroup>
          <InputGroup.Text>
            { orderType === OrderType.LIMIT ?
              <>Total:</>
            : tradeType === TradeType.BUY ?
              <>Total (max):</>
            :
              <>Total (min):</>
            }
          </InputGroup.Text>
          <Form.Control type="number" readOnly value={totalPrice} />
          <InputGroup.Text>{baseToken.symbol}</InputGroup.Text>
        </InputGroup>
        <Button type="submit" variant={tradeType === TradeType.BUY ? 'success' : 'danger'} disabled={sending}>{tradeType}</Button>

        { feedback === Feedback.PLACING_ORDER ?
          <Alert variant="primary" className="mt-3">
            <Spinner animation="border" size="sm" /> Placing order...
          </Alert>

        : feedback === Feedback.DEPOSITING_FUNDS ?
          <Alert variant="primary" className="mt-3">
            <Spinner animation="border" size="sm" /> Depositing funds...
          </Alert>

        : feedback === Feedback.ORDER_SENT ?
          <Alert variant="success" className="mt-3">Order sent</Alert>

        : feedback === Feedback.FUNDS_DEPOSITED ?
          <Alert variant="success" className="mt-3">Funds deposited</Alert>

        : feedback === Feedback.WALLET_NOT_CONNECTED ?
          <Alert variant="warning" className="mt-3">Please connect your wallet and try again</Alert>

        : feedback === Feedback.INSUFFICIENT_OPERATOR_FUNDS ?
          <Alert variant="warning" className="mt-3">
            Your Operator does not have enough funds
            <Button variant="warning" onClick={depositMissingFunds}>Deposit funds</Button>
          </Alert>

        : feedback === Feedback.INSUFFICIENT_WALLET_FUNDS ?
          <Alert variant="warning" className="mt-3">You do not have enough funds</Alert>

        : feedback === Feedback.UNEXPECTED_ERROR ?
          <Alert variant="danger" className="mt-3">An unexpected error has occurred</Alert>

        :
          <></>
        }
      </Form>
    </div>
  );
}
