import './PriceHistoryChart.scss';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { formatPrice, formatTimestamp } from '../utils/format';
import { Orderbook, PriceHistoryBar, PriceHistoryEventType, TimeFrame } from '@theorderbookdex/orderbook-dex-webapi';
import { Nav, Spinner } from 'react-bootstrap';
import { ApexOptions } from 'apexcharts';

const HEIGHT = 500;

const options = {
  chart: {
    type: 'candlestick',
    height: HEIGHT,
    markers: {
      size: 10
    },
    animations: {
      enabled: false,
    },
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
  },
  tooltip: {
    custom: () => '',
  },
  xaxis: {
    type: 'category'
  },
  yaxis: {
    tooltip: {
      enabled: true
    }
  },
  grid: {
    show: true,
    borderColor: '#333',
    strokeDashArray: 0,
    position: 'back',
    xaxis: {
      lines: {
        show: false
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    },
    row: {
      colors: undefined,
      opacity: 0.5
    },
    column: {
      colors: undefined,
      opacity: 0.5
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
  }
} as ApexOptions;

const HISTORY_SIZE = 50;

const timeframes = {
  '15m': TimeFrame.MINUTES_15,
  '1h':  TimeFrame.HOUR,
  '4h':  TimeFrame.HOUR_4,
  '1D':  TimeFrame.DAY,
  '1W':  TimeFrame.WEEK,
};

interface PriceHistoryChartProps {
  orderbook?: Orderbook;
}

export default function PriceHistoryChart({ orderbook }: PriceHistoryChartProps) {
  const [ timeFrame, setTimeFrame ] = useState(TimeFrame.MINUTES_15);
  const [ series, setSeries ] = useState<ApexOptions['series']>([ { data: [] } ]);
  const [ loading, setLoading ] = useState(false);

  useEffect(() => {
    if (!orderbook) return;

    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    const priceHistory = orderbook.getPriceHistory(timeFrame, abortSignal);

    const bars: PriceHistoryBar[] = [];

    const updateSeries = () => {
      setSeries([ { data: formatBars(timeFrame, orderbook, bars) } ]);
    };

    setLoading(true);
    updateSeries();

    void (async () => {
      try {
        for await (const bar of priceHistory) {
          if (bars.length >= HISTORY_SIZE) break;
          bars.unshift(bar);
          updateSeries();
          if (bars.length >= HISTORY_SIZE) break;
        }
        setLoading(false);

      } catch (error) {
        if (error !== abortSignal.reason) {
          // TODO handle other errors
          console.error(error);
        }
      }
    })();

    priceHistory.addEventListener(PriceHistoryEventType.HISTORY_BAR_ADDED, event => {
      bars.push(event.bar);
      if (bars.length > HISTORY_SIZE) {
        bars.shift();
      }
      updateSeries();
    }, { signal: abortSignal });

    priceHistory.addEventListener(PriceHistoryEventType.HISTORY_BAR_UPDATED, event => {
      const index = bars.findIndex(bar => bar.timestamp === event.bar.timestamp);
      if (index >= 0) {
        bars[index] = event.bar;
      }
      updateSeries();
    }, { signal: abortSignal });

    return () => abortController.abort();
  }, [ orderbook, timeFrame ]);

  return (
    <div className="price-history-chart">
      <Nav>
        {Object.entries(timeframes).map(([ label, tf ]) => (
          <Nav.Link key={label} active={tf === timeFrame} onClick={() => setTimeFrame(tf)}>{label}</Nav.Link>
        ))}
        {loading && <Spinner animation="border" size="sm" />}
      </Nav>
      <ReactApexChart options={options} series={series} type="candlestick" height={HEIGHT} />
    </div>
  );
}

interface Bar {
  x: string;
  y: number[];
}

function formatBars(timeFrame: TimeFrame, orderbook: Orderbook, bars: PriceHistoryBar[]): Bar[] {
  const formatted: Bar[] = [];

  if (!bars.length) return formatted;

  if (bars.length < HISTORY_SIZE) {
    let missing = HISTORY_SIZE - bars.length;
    let timestamp = bars[0].timestamp - timeFrame * missing;
    while (missing) {
      formatted.push({
        x: formatTimestamp(timestamp),
        y: [],
      });
      timestamp += timeFrame;
      missing--;
    }
  }

  for (const bar of bars) {
    formatted.push({
      x: formatTimestamp(bar.timestamp),
      y: [
        Number(formatPrice(orderbook, bar.open)),
        Number(formatPrice(orderbook, bar.high)),
        Number(formatPrice(orderbook, bar.low)),
        Number(formatPrice(orderbook, bar.close)),
      ]
    });
  }

  return formatted;
}
