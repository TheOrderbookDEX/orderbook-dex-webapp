import './ExchangePage.scss';
import { useState } from 'react';
import Orders from './Orders';
import OrderbooksList from './OrderbooksList';
import PricePointsChart from './PricePointsChart';
import PriceHistoryChart from './PriceHistoryChart';
import OrderbookHeader from './OrderbookHeader';
import { Orderbook } from '@theorderbookdex/orderbook-dex-webapi';
import TradeOperation from './TradeOperation';
import { Col, Row } from 'react-bootstrap';

export default function ExchangePage() {
  const [ selected, setSelected ] = useState<Orderbook>();

  return (
    <div className="exchange-page row g-0 flex-row-reverse">
      <Col className="row g-0 align-content-start" xs={12} xl={3}>
        <Col xs={12} md={6} xl={12}>
          <OrderbooksList onSelect={setSelected} />
        </Col>
        {selected &&
          <Col xs={12} md={6} xl={12}>
            <TradeOperation orderbook={selected} />
          </Col>
        }
      </Col>
      <Col xs={12} xl={9} className="vstack">
        <OrderbookHeader orderbook={selected} />
        <Row className="g-0 flex-row-reverse">
          <Col xs={12} lg={8}>
            <PriceHistoryChart orderbook={selected} />
          </Col>
          <Col xs={12} lg={4}>
            <PricePointsChart orderbook={selected} />
          </Col>
        </Row>
        <Orders />
      </Col>
    </div>
  );
};
