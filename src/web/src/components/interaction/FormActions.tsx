import React, { useState } from 'react'; // v18.2.0
import Button, { ButtonProps } from '../ui/Button';
import DeleteConfirmation from './DeleteConfirmation';
import { Interaction } from '../../types/interactions';

/**
 * Props interface for the FormActions component
 */
export interface FormActionsProps {
  /**
   * Function to handle saving the interaction
   */
  onSave: () => void;
  
  /**
   * Function to handle saving and creating a new interaction
   */
  onSaveAndNew: () => void;
  
  /**
   * Function to handle canceling the form operation
   */
  onCancel: () => void;
  
  /**
   * Function to handle deleting the interaction (after confirmation)
   */
  onDelete: () => void;
  
  /**
   * Whether a form submission is currently in progress
   */
  isSubmitting: boolean;
  
  /**
   * Whether the form is in edit mode (vs. create mode)
   */
  isEdit: boolean;
  
  /**
   * The current interaction object (used for delete confirmation)
   */
  interaction: Interaction | null;
  
  /**
   * Optional CSS class to apply to the container
   */
  className?: string;
}

/**
 * Component that renders action buttons for the Interaction Form,
 * allowing users to save, save and create another, cancel, or delete interactions.
 * 
 * The component also manages the delete confirmation dialog state.
 */
const FormActions: React.FC<FormActionsProps> = ({
  onSave,
  onSaveAndNew,
  onCancel,
  onDelete,
  isSubmitting,
  isEdit,
  interaction,
  className = ''
}) => {
  // State for managing the delete confirmation dialog
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  /**
   * Opens the delete confirmation dialog
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  /**
   * Closes the delete confirmation dialog
   */
  const handleCloseDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
  };

  /**
   * Handles the confirmed deletion and closes the dialog
   */
  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirmation(false);
  };

  return (
    <div className={`flex flex-wrap justify-end space-x-0 space-y-2 sm:space-y-0 sm:space-x-3 mt-6 ${className}`}>
      {/* On mobile, stack buttons vertically with full width */}
      <div className="w-full sm:w-auto order-1 sm:order-none">
        <Button
          variant="primary"
          onClick={onSave}
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
          type="submit"
          data-testid="save-button"
        >
          Save
        </Button>
      </div>

      <div className="w-full sm:w-auto order-2 sm:order-none">
        <Button
          variant="outline"
          onClick={onSaveAndNew}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
          data-testid="save-and-new-button"
        >
          Save & New
        </Button>
      </div>

      <div className="w-full sm:w-auto order-3 sm:order-none">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
          data-testid="cancel-button"
        >
          Cancel
        </Button>
      </div>

      {/* Only show delete button in edit mode */}
      {isEdit && (
        <div className="w-full sm:w-auto order-4 sm:order-none">
          <Button
            variant="danger"
            onClick={handleDeleteClick}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
            data-testid="delete-button"
          >
            Delete
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={handleCloseDeleteConfirmation}
        onDelete={handleConfirmDelete}
        interaction={interaction}
      />
    </div>
  );
};

export default FormActions;