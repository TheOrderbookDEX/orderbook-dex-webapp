import { Token, OrderbookDEX, Operator, OrderbookDEXEventType, OperatorEventType } from '@theorderbookdex/orderbook-dex-webapi';
import { useContext, useEffect, useState } from 'react';
import { Col, Spinner } from 'react-bootstrap';
import OperatorTokenList from './OperatorTokenList';
import OperatorToken from './OperatorToken';
import { WalletContext } from '../context/WalletContext';
import OperatorAddTokenForm from './OperatorAddTokenForm';

export interface TokenWithBalance {
  data: Token;
  balance: {
    wallet: bigint;
    operator: bigint;
  }
}

export default function OperatorPage() {
  const wallet = useContext(WalletContext);
  const [ selected, setSelected ] = useState<TokenWithBalance>();
  const [ tokens, setTokens ] = useState<TokenWithBalance[]>();

  useEffect(() => {
    if (!wallet.connected) return;

    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    OrderbookDEX.instance.addEventListener(OrderbookDEXEventType.TOKEN_ADDED, async ({ token }) => {
      try {
        const balance = await Operator.instance.getBalance(token, abortSignal);
        setTokens(tokens => tokens?.concat([ { data: token, balance } ]));
      } catch (error) {
        if (error !== abortSignal.reason) {
          // TODO handle other errors
          console.error(error);
        }
      }
    }, { signal: abortSignal });

    OrderbookDEX.instance.addEventListener(OrderbookDEXEventType.TOKEN_REMOVED, ({ token }) => {
      setTokens(tokens => tokens?.filter(({ data: { address } }) => address !== token.address));
      setSelected(selected => selected?.data.address === token.address ? undefined : selected);
    }, { signal: abortSignal });

    Operator.instance.addEventListener(OperatorEventType.TOKEN_DEPOSITED, ({ token, amount }) => {
      setTokens(tokens => tokens?.map(({ data, balance }) => data.address === token.address ? {
        data,
        balance: {
          operator: balance.operator + amount,
          wallet: balance.wallet - amount,
        }
      } : { data, balance }));
      setSelected(selected => selected?.data.address === token.address ? {
        data: selected.data,
        balance: {
          operator: selected.balance.operator + amount,
          wallet: selected.balance.wallet - amount,
        }
      } : selected);
    }, { signal: abortSignal });

    Operator.instance.addEventListener(OperatorEventType.TOKEN_WITHDRAWN, ({ token, amount }) => {
      setTokens(tokens => tokens?.map(({ data, balance }) => data.address === token.address ? {
        data,
        balance: {
          operator: balance.operator - amount,
          wallet: balance.wallet + amount,
        }
      } : { data, balance }));
      setSelected(selected => selected?.data.address === token.address ? {
        data: selected.data,
        balance: {
          operator: selected.balance.operator - amount,
          wallet: selected.balance.wallet + amount,
        }
      } : selected);
    }, { signal: abortSignal });

    void (async () => {
      try {
        const tokens = new Array<TokenWithBalance>();
        for await (const token of OrderbookDEX.instance.getTokens(abortSignal)) {
          tokens.push({
            data: token,
            balance: await Operator.instance.getBalance(token, abortSignal),
          });
        }
        setSelected(tokens[0]);
        setTokens(tokens);
      } catch (error) {
        if (error !== abortSignal.reason) {
          // TODO handle other errors
          console.error(error);
        }
      }
    })();

    return () => abortController.abort();
  }, [ wallet ]);

  if (tokens) {
    return (
      <>
        <Col lg="4" className="border-end">
          <OperatorTokenList
            tokens={tokens}
            selected={selected}
            onSelect={setSelected} />
        </Col>
        <Col lg="8">
          {selected ?
            <OperatorToken token={selected} /> :
            <OperatorAddTokenForm />
          }
        </Col>
      </>
    );

  } else {
    return (
      <Spinner animation="border" className="m-auto align-self-center" />
    );
  }
}
