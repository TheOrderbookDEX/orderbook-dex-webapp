import { Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import NavMenu from './NavMenu';
import UserMenu from './UserMenu';

export default function Header() {
  return (
    <header>
      <Navbar expand="lg" variant="dark" className="align-items-stretch border-0 border-bottom">
        <Navbar.Brand as={Link} to="/">The Orderbook DEX</Navbar.Brand>
        <Navbar.Toggle aria-controls="header-navbar-nav" />
        <Navbar.Collapse id="header-navbar-nav" className="align-items-stretch">
          <NavMenu />
          <Nav className="ms-auto px-3 py-1 align-items-center">
            <UserMenu />
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </header>
  );
}
