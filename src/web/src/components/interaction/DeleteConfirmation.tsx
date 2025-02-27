import React, { useState, useCallback } from 'react';
import ConfirmDialog, { ConfirmDialogProps } from '../shared/ConfirmDialog';
import { Interaction } from '../../types/interactions';
import { deleteInteraction } from '../../api/interactions';
import { useNotification } from '../../hooks/useNotification';

/**
 * Props for the DeleteConfirmation component
 */
export interface DeleteConfirmationProps {
  /**
   * Controls whether the confirmation dialog is displayed
   */
  isOpen: boolean;
  
  /**
   * Function called when dialog should close
   */
  onClose: () => void;
  
  /**
   * Function called after successful deletion
   */
  onDelete: () => void;
  
  /**
   * The interaction to be deleted
   */
  interaction: Interaction | null;
}

/**
 * Component that displays a confirmation dialog when deleting an interaction.
 * Provides a clear warning message, shows the interaction title for confirmation,
 * and handles the delete operation through the API.
 */
const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onDelete,
  interaction
}) => {
  // State for tracking loading status during delete operation
  const [isLoading, setIsLoading] = useState(false);
  
  // Get notification functions for displaying success/error messages
  const { showSuccess, showError } = useNotification();
  
  // Handle the delete operation
  const handleDelete = useCallback(async () => {
    if (!interaction) return;
    
    setIsLoading(true);
    try {
      const response = await deleteInteraction(interaction.id);
      if (response.status === 'success') {
        showSuccess('Interaction deleted successfully');
        onDelete(); // Notify parent component of successful deletion
      } else {
        showError('Failed to delete interaction');
      }
    } catch (error) {
      showError('An error occurred while deleting the interaction');
      console.error('Delete interaction error:', error);
    } finally {
      setIsLoading(false);
      onClose(); // Close the dialog regardless of success/failure
    }
  }, [interaction, onDelete, onClose, showSuccess, showError]);
  
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Confirm Delete"
      message="Are you sure you want to delete this interaction?"
      itemName={interaction?.title}
      confirmText="Delete"
      cancelText="Cancel"
      isLoading={isLoading}
      alertType="warning"
    />
  );
};

export default DeleteConfirmation;