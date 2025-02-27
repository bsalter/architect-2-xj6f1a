import React, { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom'; // v18.2.0
import classNames from 'classnames'; // v2.3.2
import Button from './Button';

export interface ModalProps {
  /**
   * Controls whether the modal is displayed
   */
  isOpen: boolean;
  
  /**
   * Function called when the modal should close
   */
  onClose: () => void;
  
  /**
   * Content to render inside the modal
   */
  children: ReactNode;
  
  /**
   * Optional title for the modal header
   */
  title?: string;
  
  /**
   * Size of the modal
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether clicking the backdrop should close the modal
   * @default true
   */
  closeOnBackdropClick?: boolean;
  
  /**
   * Whether pressing Escape should close the modal
   * @default true
   */
  closeOnEsc?: boolean;
  
  /**
   * Whether to show a close button in the header
   * @default true
   */
  showCloseButton?: boolean;
  
  /**
   * Additional CSS classes to apply to the modal
   */
  className?: string;
}

/**
 * A reusable modal dialog component that supports customization, accessibility, and animations.
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
}) => {
  // Create a ref for the modal dialog element for focus trapping
  const modalRef = useRef<HTMLDivElement>(null);
  
  /**
   * Event handler function to close the modal when the Escape key is pressed
   */
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEsc) {
      onClose();
    }
  };

  /**
   * Event handler function to close the modal when the backdrop is clicked
   */
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (
      modalRef.current && 
      !modalRef.current.contains(event.target as Node) && 
      closeOnBackdropClick
    ) {
      onClose();
    }
  };

  /**
   * Function to trap focus inside the modal for accessibility
   */
  const trapFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !modalRef.current) return;
    
    const focusableElements = modalRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // If shift+tab on first element, move to last element
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } 
    // If tab on last element, move to first element
    else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  // Handle escape key press to close the modal
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Add padding to body to replace scrollbar and prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Handle focus trapping for accessibility
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // Save the currently focused element to restore focus when modal closes
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus the modal or first focusable element inside it
    const focusModal = () => {
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length) {
          (focusableElements[0] as HTMLElement).focus();
        } else {
          modalRef.current.focus();
        }
      }
    };
    
    // Small delay to ensure the modal is visible before focusing
    const timeoutId = setTimeout(focusModal, 50);

    document.addEventListener('keydown', trapFocus);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', trapFocus);
      
      // Restore focus to previously focused element when modal closes
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  // Size classes for the modal
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size];

  // Create portal for the modal
  return createPortal(
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={title ? 'modal-title' : undefined}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal container with centering */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Modal content */}
        <div
          ref={modalRef}
          className={classNames(
            'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl',
            'transition-all duration-300 ease-in-out',
            'w-full sm:my-8',
            sizeClasses,
            className
          )}
          tabIndex={-1}
        >
          {/* Modal header with title and close button */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between bg-gray-50 px-4 py-3 border-b sm:px-6">
              {title ? (
                <h3
                  className="text-lg font-medium leading-6 text-gray-900"
                  id="modal-title"
                >
                  {title}
                </h3>
              ) : (
                <div></div> // Empty div to maintain flex layout when no title
              )}
              
              {showCloseButton && (
                <Button
                  variant="link"
                  aria-label="Close"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  size="sm"
                >
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
          )}

          {/* Modal body */}
          <div className="bg-white px-4 py-5 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;