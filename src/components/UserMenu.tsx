import { useContext } from 'react';
import { Button, Dropdown, Figure, Spinner } from 'react-bootstrap';
import { WalletContext } from '../context/WalletContext';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { Chain, Wallet } from '@theorderbookdex/orderbook-dex-webapi';
import { formatShorterAddress } from '../utils/format';

export default function UserMenu() {
  const { connecting, connected, connect } = useContext(WalletContext);

  if (connected) {
    return (
      <Dropdown>
        <Dropdown.Toggle className="px-0 py-1" variant="link">
          <Jazzicon paperStyles={{ verticalAlign: 'middle' }} diameter={30} seed={jsNumberForAddress(Wallet.instance.address)} />
        </Dropdown.Toggle>
        <Dropdown.Menu align="end" className="text-body bg-body">
          <Dropdown.Header>
            <Figure className="text-center d-block mb-0">
              <Jazzicon diameter={64} seed={jsNumberForAddress(Wallet.instance.address)} />
              <Figure.Caption>
                <div className="fw-bold">{Chain.instance.chainName}</div>
                <div>{formatShorterAddress(Wallet.instance.address)}</div>
              </Figure.Caption>
            </Figure>
          </Dropdown.Header>
        </Dropdown.Menu>
      </Dropdown>
    );

  } else if (connecting) {
    return (
      <Spinner animation="border" />
    );

  } else {
    return (
      <Button className="py-1" onClick={connect}>Connect</Button>
    );
  }
}
