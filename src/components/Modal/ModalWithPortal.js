import Portal from "components/Portal/Portal";
import Modal from "./Modal";

export default function ModalWithPortal(props) {
  return (
    <Portal>
      <Modal {...props} />
    </Portal>
  );
}
