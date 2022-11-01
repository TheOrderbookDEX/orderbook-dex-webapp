import { useCallback } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function PageNotFound() {
  const navigate = useNavigate();

  const close = useCallback(() => {
    navigate('/');
  }, [ navigate ]);

  return (
    <Modal show onHide={close}>
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title>Page Not Found</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>If you find yourself here while using the app, please let us know so we can fix it.</p>
        <p>
          If you got here following a link from outside the app or a bookmark, the app might have changed
          since the link or bookmark was created, and the page you are looking for either does no longer
          exist or its URL has changed.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
