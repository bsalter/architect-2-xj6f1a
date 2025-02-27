import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import InteractionForm from '../components/interaction/InteractionForm';
import PageHeader from '../components/shared/PageHeader';
import LoadingScreen from '../components/shared/LoadingScreen';
import DeleteConfirmation from '../components/interaction/DeleteConfirmation';
import NotFound from '../components/shared/NotFound';

import { useNotification } from '../hooks/useNotification';
import { Interaction, InteractionFormData } from '../types/interactions';
import { ValidationError } from '../types/api';
import { getInteraction, updateInteraction } from '../api/interactions';

/**
 * Page component for editing an existing interaction.
 * It fetches the interaction data, displays a form pre-populated with this data,
 * and handles form submission, cancellation, and deletion.
 */
const InteractionEdit: React.FC = () => {
  // Get the interaction ID from URL parameters
  const { id } = useParams<{ id: string }>();
  
  // State for interaction data, loading state, and errors
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  
  // Navigation and notification hooks
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  // Fetch interaction data when component mounts
  useEffect(() => {
    const fetchInteraction = async () => {
      if (!id) {
        setError('Interaction ID is required');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await getInteraction(parseInt(id, 10));
        
        if (response.status === 'success' && response.data && response.data.interaction) {
          setInteraction(response.data.interaction);
        } else {
          setError('Failed to load interaction');
        }
      } catch (err) {
        console.error('Error fetching interaction:', err);
        setError('Failed to load interaction');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInteraction();
  }, [id]);
  
  // Handle form submission
  const handleSubmit = async (formData: InteractionFormData): Promise<void> => {
    if (!id || !interaction) return;
    
    setIsSubmitting(true);
    setValidationErrors([]);
    
    try {
      const response = await updateInteraction(parseInt(id, 10), formData);
      
      if (response.status === 'success') {
        showSuccess('Interaction updated successfully');
        navigate('/finder');
      } else {
        if (response.error?.details) {
          setValidationErrors(response.error.details);
        }
        showError('Failed to update interaction');
      }
    } catch (err: any) {
      console.error('Error updating interaction:', err);
      showError('Failed to update interaction');
      
      if (err.error?.details) {
        setValidationErrors(err.error.details);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancellation
  const handleCancel = () => {
    navigate('/finder');
  };
  
  // Handle delete request
  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };
  
  // Handle successful deletion (called by DeleteConfirmation component)
  const handleDeleteSuccess = () => {
    showSuccess('Interaction deleted successfully');
    navigate('/finder');
  };
  
  // Render loading state
  if (isLoading) {
    return <LoadingScreen message="Loading interaction..." />;
  }
  
  // Render error state
  if (error) {
    return (
      <div className="p-4">
        <PageHeader 
          title="Edit Interaction" 
          backButton={{ path: '/finder' }}
        />
        <div className="text-red-500">{error}</div>
      </div>
    );
  }
  
  // Render not found state
  if (!interaction) {
    return <NotFound message="The requested interaction could not be found." backRoute="/finder" />;
  }
  
  // Render the form
  return (
    <div className="p-4">
      <PageHeader 
        title="Edit Interaction" 
        backButton={{ path: '/finder' }}
      />
      
      <InteractionForm
        initialData={interaction}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDelete={handleDelete}
        isSubmitting={isSubmitting}
        validationErrors={validationErrors}
      />
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onDelete={handleDeleteSuccess}
        interaction={interaction}
      />
    </div>
  );
};

export default InteractionEdit;