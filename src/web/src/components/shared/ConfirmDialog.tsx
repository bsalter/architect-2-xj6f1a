import React, { ReactNode } from 'react';
import Modal, { ModalProps } from '../ui/Modal';
import Button, { ButtonVariant } from '../ui/Button';
import Alert, { AlertVariantType } from '../ui/Alert';

// Define type for alert types
type AlertType = AlertVariantType;

/**
 * Props interface for the ConfirmDialog component
 */
export interface ConfirmDialogProps {
  /**
   * Controls whether the dialog is displayed
   */
  isOpen: boolean;
  
  /**
   * Function called when dialog should close
   */
  onClose: () => void;
  
  /**
   * Function called when user confirms action
   */
  onConfirm: () => void | Promise<void>;
  
  /**
   * Title of the confirmation dialog
   */
  title: string;
  
  /**
   * Message content explaining the action
   */
  message: string | ReactNode;
  
  /**
   * Text for confirm button
   * @default "Confirm"
   */
  confirmText?: string;
  
  /**
   * Text for cancel button
   * @default "Cancel"
   */
  cancelText?: string;
  
  /**
   * Whether the confirm action is processing
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Type of the alert (determines styling)
   * @default "warning"
   */
  alertType?: AlertType;
  
  /**
   * Optional name of the item being affected
   */
  itemName?: string;
  
  /**
   * Variant of the confirm button
   * If not provided, will be determined based on alertType
   */
  confirmButtonVariant?: ButtonVariant;
}

/**
 * A reusable confirmation dialog component that shows a modal with confirm and cancel buttons
 * to verify user intent before performing potentially destructive or important actions.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  alertType = 'warning',
  itemName,
  confirmButtonVariant,
}) => {
  // Determine the appropriate button variant based on the alertType if not explicitly provided
  const buttonVariant = confirmButtonVariant || 
    (alertType === 'warning' || alertType === 'error' ? 'danger' : 'primary');
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdropClick={!isLoading}
      closeOnEsc={!isLoading}
      showCloseButton={!isLoading}
    >
      <div className="space-y-4">
        {/* Alert component to display the message with appropriate styling */}
        <Alert variant={alertType}>
          {typeof message === 'string' && itemName 
            ? `${message} "${itemName}"`
            : message}
        </Alert>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            aria-label={cancelText}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            aria-label={confirmText}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;