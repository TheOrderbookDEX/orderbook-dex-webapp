import { Nav } from 'react-bootstrap';
import { Link, useMatch } from 'react-router-dom';

export default function NavMenu() {
  return (
    <Nav className="me-auto">
      <Nav.Link as={Link} to="/" active={!!useMatch('/')}>Exchange</Nav.Link>
      <Nav.Link as={Link} to="/operator" active={!!useMatch('/operator')}>Operator</Nav.Link>
    </Nav>
  );
}
