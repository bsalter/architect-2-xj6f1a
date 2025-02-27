import React from 'react'; // v18.2.0
import FormField from '../ui/FormField';
import Select from '../ui/Select';
import { InteractionType } from '../../types/interactions';

/**
 * Props for the TypeSelector component
 */
export interface TypeSelectorProps {
  /**
   * The currently selected interaction type
   */
  value: InteractionType | string;
  
  /**
   * Callback function called when the selected type changes
   */
  onChange: (value: InteractionType | string) => void;
  
  /**
   * Error message to display if validation fails
   */
  error?: string;
  
  /**
   * Whether the selector is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Unique identifier for the select element
   */
  id: string;
  
  /**
   * Name attribute for the select element
   */
  name: string;
  
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
}

/**
 * A component that renders a dropdown selector for interaction types.
 * Uses the InteractionType enum to ensure consistent type options across the application.
 * 
 * @example
 * <TypeSelector
 *   id="interaction-type"
 *   name="type"
 *   value={formValues.type}
 *   onChange={(value) => setFormValues({...formValues, type: value})}
 *   error={errors.type}
 *   required
 * />
 */
const TypeSelector: React.FC<TypeSelectorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  id,
  name,
  className,
}) => {
  /**
   * Handles changes to the select element
   * Converts the string value to an InteractionType and calls the onChange handler
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    onChange(newValue as InteractionType);
  };

  return (
    <FormField
      label="Type"
      error={error}
      required={required}
      htmlFor={id}
      className={className}
    >
      <Select
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        isError={!!error}
        disabled={disabled}
        required={required}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {Object.values(InteractionType).map((type) => (
          <option key={type} value={type}>
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </option>
        ))}
      </Select>
    </FormField>
  );
};

export default TypeSelector;