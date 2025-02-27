import React, { useState, useEffect } from 'react'; // react v18.2.0
import { useNavigate } from 'react-router-dom'; // react-router-dom v6.14.2

// Internal components
import MainLayout from '../components/layout/MainLayout';
import InteractionForm from '../components/interaction/InteractionForm';
import PageHeader from '../components/shared/PageHeader';
import LoadingScreen from '../components/shared/LoadingScreen';

// Custom hooks
import { useCreateInteraction } from '../hooks/useInteractions';
import useSite from '../hooks/useSite';
import useNotification from '../hooks/useNotification';

// Types
import { InteractionFormData } from '../types/interactions';
import { ValidationError } from '../types/api';

/**
 * Page component for creating new interactions.
 * Provides a blank form interface and handles form submission, validation,
 * and API communication while ensuring proper site context association.
 *
 * @returns {JSX.Element} Rendered page component
 */
const InteractionCreate: React.FC = () => {
  // Initialize navigation hook for redirection after submission
  const navigate = useNavigate();
  
  // Access site context to ensure proper site association
  const { currentSite } = useSite();
  
  // Initialize notification hooks for user feedback
  const { showSuccess, showError } = useNotification();
  
  // Set up state for validation errors and loading state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  
  // Initialize create interaction mutation
  const createInteractionMutation = useCreateInteraction({
    onSuccess: () => {
      showSuccess('Interaction created successfully');
      navigate('/finder');
    },
    onError: (error) => {
      if (error.details) {
        setValidationErrors(error.details);
      }
      showError(error.message || 'Failed to create interaction');
    }
  });
  
  /**
   * Handles the form submission for creating a new interaction
   * 
   * @param {InteractionFormData} formData - The form data to submit
   * @returns {Promise<void>} Promise that resolves when submission completes
   */
  const handleSubmit = async (formData: InteractionFormData): Promise<void> => {
    // Clear any previous validation errors
    setValidationErrors([]);
    
    try {
      // Ensure there's a site context
      if (!currentSite) {
        showError('No active site selected. Please select a site before creating an interaction.');
        return;
      }
      
      // Call mutation to create interaction
      await createInteractionMutation.mutateAsync(formData);
    } catch (err: any) {
      // This catch block is mainly for handling unexpected errors,
      // as mutation errors are handled in the onError callback
      showError('An unexpected error occurred: ' + (err.message || 'Unknown error'));
    }
  };
  
  /**
   * Handles cancellation of form submission
   */
  const handleCancel = () => {
    navigate('/finder'); // Navigate back to the Finder view
  };
  
  return (
    <MainLayout>
      <PageHeader 
        title="Create Interaction" 
        backButton={{ path: '/finder', label: 'Back to Finder' }}
      />
      
      <InteractionForm 
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createInteractionMutation.isLoading}
        validationErrors={validationErrors}
      />
    </MainLayout>
  );
};

export default InteractionCreate;