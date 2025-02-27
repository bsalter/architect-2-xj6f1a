import React, { useState } from 'react'; // react v18.2.0
import { format } from 'date-fns'; // date-fns v2.30.0
import useAuth from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/shared/PageHeader';
import Card from '../components/ui/Card';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getCurrentUser } from '../api/auth';
import useForm from '../hooks/useForm';
import useNotification from '../hooks/useNotification';
import { User } from '../types/auth';

// Define form values interface for profile data
interface ProfileFormValues {
  username: string;
  email: string;
}

/**
 * Main component that renders the user profile page with user information and editable fields
 * 
 * @returns The rendered user profile page
 */
const UserProfile: React.FC = () => {
  // Get current user data from authentication context
  const { user } = useAuth();
  
  // State to track if the form is in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Initialize notification hooks for displaying success/error messages
  const { showSuccess, showError } = useNotification();
  
  // Set up form state using useForm hook with initial values from user data
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
    resetForm
  } = useForm<ProfileFormValues>(
    {
      username: user?.username || '',
      email: user?.email || '',
    },
    handleProfileUpdate
  );
  
  /**
   * Handles the submission of the profile update form
   * 
   * @param formData - The form data to submit
   */
  async function handleProfileUpdate(formData: ProfileFormValues) {
    try {
      // In a real implementation, this would call an API to update the profile
      // For example: await updateUserProfile(user.id, formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch updated user information to refresh the view
      await getCurrentUser();
      
      // Display success notification
      showSuccess('Profile updated successfully');
      
      // Exit edit mode
      setIsEditMode(false);
    } catch (error) {
      // Handle error and display error notification
      showError('Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    }
  }
  
  /**
   * Toggles between read-only and edit mode for the profile form
   */
  function toggleEditMode() {
    if (isEditMode && user) {
      // If canceling edit, reset form values to current user data
      resetForm({
        username: user.username,
        email: user.email,
      });
    }
    
    setIsEditMode(!isEditMode);
  }
  
  // Format last login date for readable display
  const formattedLastLogin = user?.lastLogin 
    ? format(new Date(user.lastLogin), 'PPpp') 
    : 'No login recorded';
  
  return (
    <MainLayout>
      <PageHeader title="Your Profile" />
      
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Account Information</h2>
          
          {user ? (
            <div className="space-y-6">
              {/* Username field */}
              <FormField
                label="Username"
                htmlFor="username"
                error={isEditMode ? errors.username : undefined}
              >
                {isEditMode ? (
                  <Input
                    id="username"
                    name="username"
                    value={values.username}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                ) : (
                  <div className="py-2">{user.username}</div>
                )}
              </FormField>
              
              {/* Email field */}
              <FormField
                label="Email Address"
                htmlFor="email"
                error={isEditMode ? errors.email : undefined}
              >
                {isEditMode ? (
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                ) : (
                  <div className="py-2">{user.email}</div>
                )}
              </FormField>
              
              {/* Last login field (read-only) */}
              <FormField label="Last Login" htmlFor="last-login">
                <div className="py-2">
                  {formattedLastLogin}
                </div>
              </FormField>
              
              {/* Action buttons */}
              <div className="flex space-x-4 pt-4">
                {isEditMode ? (
                  <>
                    <Button 
                      variant="primary" 
                      onClick={() => handleSubmit()}
                      isLoading={isSubmitting}
                    >
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={toggleEditMode}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" onClick={toggleEditMode}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading user information...</p>
            </div>
          )}
        </div>
      </Card>
    </MainLayout>
  );
};

export default UserProfile;