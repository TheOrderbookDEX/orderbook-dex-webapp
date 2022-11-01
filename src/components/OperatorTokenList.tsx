import { ListGroup } from 'react-bootstrap';
import { TokenWithBalance } from './OperatorPage';

interface OperatorTokenListProps {
  tokens: TokenWithBalance[];
  selected?: TokenWithBalance;
  onSelect: (token: TokenWithBalance | undefined) => void;
}

export default function OperatorTokenList({
  tokens, selected, onSelect
}: OperatorTokenListProps) {
  return (
    <ListGroup variant="flush" className="font-monospace border-bottom lh-sm">
      {tokens.map(token =>
        <ListGroup.Item key={token.data.address} action active={token === selected} onClick={() => onSelect(token)}
          className="d-flex justify-content-between align-items-center p-3 pb-4">
          <div>
            <div className="fs-2">{token.data.symbol}</div>
            <div>{token.data.name}</div>
          </div>
          <div className="text-end">
            <div className="fs-2">{token.data.formatAmount(token.balance.operator)}</div>
            <div>{token.data.formatAmount(token.balance.wallet)}</div>
          </div>
        </ListGroup.Item>
      )}
      <ListGroup.Item action active={selected === undefined} onClick={() => onSelect(undefined)}
        className="fs-2 text-uppercase text-center p-3">
        Add Token
      </ListGroup.Item>
    </ListGroup>
  );
}
