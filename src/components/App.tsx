import { BrowserRouter } from 'react-router-dom';
import APILoader from './APILoader';
import SingleInstanceMutex from './SingleInstanceMutex';
import { WalletProvider } from '../context/WalletContext';
import Footer from './Footer';
import Header from './Header';
import { Route, Routes } from 'react-router-dom';
import ExchangePage from './ExchangePage';
import OperatorPage from './OperatorPage';
import Notfound from './PageNotFound';
import RequiresWallet from './RequiresWallet';
import { Row, Stack } from 'react-bootstrap';

export default function App() {
  return (
    <SingleInstanceMutex>
      <BrowserRouter basename='/app'>
        <APILoader>
          <WalletProvider>
            <Stack className="min-vh-100">
              <Header />
              <Row className="flex-grow-1 g-0">
                <Routes>
                  <Route path="/" element={<ExchangePage />} />
                  <Route path="/operator" element={
                    <RequiresWallet>
                      <OperatorPage />
                    </RequiresWallet>
                  } />
                  <Route path="*" element={<Notfound />} />
                </Routes>
              </Row>
              <Footer />
            </Stack>
          </WalletProvider>
        </APILoader>
      </BrowserRouter>
    </SingleInstanceMutex>
  );
}
