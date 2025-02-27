import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import InteractionFinder from '../components/finder/InteractionFinder';
import useInteractions from '../hooks/useInteractions';
import useSite from '../hooks/useSite';
import useAuth from '../hooks/useAuth';
import useNotification from '../hooks/useNotification';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/shared/PageHeader';
import Button from '../components/ui/Button';
import LoadingScreen from '../components/shared/LoadingScreen';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { Interaction, SearchParams, SortDirection } from '../types/interactions';
import { deleteInteraction } from '../api/interactions';

/**
 * Main component for the Finder page that displays interactions in a searchable table
 * 
 * This component implements the following requirements:
 * - F-006-RQ-001: Displays interactions in a tabular format showing all required fields
 * - F-007-RQ-001: Provides search functionality across all interaction fields
 * - F-002-RQ-002: Filters all interaction data based on user's site access
 * - F-005-RQ-001: Allows deletion of interaction records
 */
const FinderPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State for delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [interactionToDelete, setInteractionToDelete] = useState<Interaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Get authentication context
  const { isAuthenticated } = useAuth();
  
  // Get site context
  const { currentSite } = useSite();
  
  // Get notification functions
  const { showSuccess, showError } = useNotification();
  
  /**
   * Handler for triggering the delete confirmation dialog
   */
  const handleDeleteClick = useCallback((interaction: Interaction) => {
    setInteractionToDelete(interaction);
    setShowDeleteConfirm(true);
  }, []);
  
  /**
   * Handler for confirming the deletion of an interaction
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!interactionToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteInteraction(interactionToDelete.id);
      
      // Show success notification
      showSuccess(`Interaction "${interactionToDelete.title}" was successfully deleted.`);
      
      // Close the dialog
      setShowDeleteConfirm(false);
      setInteractionToDelete(null);
    } catch (error) {
      const errorMessage = error.error?.message || 'Failed to delete interaction';
      showError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [interactionToDelete, showSuccess, showError]);
  
  /**
   * Handler for canceling the deletion
   */
  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setInteractionToDelete(null);
  }, []);
  
  /**
   * Handler for navigating to create a new interaction
   */
  const handleCreateNew = useCallback(() => {
    navigate('/interactions/new');
  }, [navigate]);
  
  /**
   * Handler for navigating to edit an interaction
   */
  const handleEditInteraction = useCallback((id: number) => {
    navigate(`/interactions/${id}/edit`);
  }, [navigate]);
  
  return (
    <MainLayout>
      <PageHeader
        title="Interaction Finder"
        actions={
          <Button
            variant="primary"
            onClick={handleCreateNew}
            data-testid="create-interaction-button"
          >
            New Interaction
          </Button>
        }
      />
      
      <InteractionFinder />
      
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Interaction"
        message="Are you sure you want to delete this interaction?"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        alertType="error"
        itemName={interactionToDelete?.title}
        confirmButtonVariant="danger"
      />
    </MainLayout>
  );
};

export default FinderPage;