import React from 'react';
import { useNavigate } from 'react-router-dom'; // v6.14.2
import Button from '../ui/Button';
import { Interaction } from '../../types/interactions';
import { formatDateTime } from '../../utils/date';

/**
 * Props interface for the InteractionTableRow component
 */
interface InteractionTableRowProps {
  /**
   * The interaction data to display in the row
   */
  interaction: Interaction;
  
  /**
   * Whether this row is currently selected
   */
  isSelected?: boolean;
  
  /**
   * Callback function when the row is clicked
   */
  onRowClick: (id: number) => void;
}

/**
 * A component that renders a single row in the interaction table
 * Displays interaction details and provides an edit button
 */
const InteractionTableRow: React.FC<InteractionTableRowProps> = ({
  interaction,
  isSelected = false,
  onRowClick,
}) => {
  const navigate = useNavigate();

  /**
   * Handles click event on the table row to select the interaction
   */
  const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    onRowClick(interaction.id);
  };

  /**
   * Handles click event on the edit button to navigate to the edit page
   * Stops propagation to prevent triggering row selection
   */
  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    navigate(`/interactions/${interaction.id}/edit`);
  };

  return (
    <tr 
      onClick={handleRowClick}
      className={`border-b border-gray-200 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
      data-testid="interaction-row"
    >
      <td className="px-4 py-3 text-sm">{interaction.title}</td>
      <td className="px-4 py-3 text-sm">{interaction.type}</td>
      <td className="px-4 py-3 text-sm">{interaction.lead}</td>
      <td className="px-4 py-3 text-sm">
        {formatDateTime(interaction.startDateTime, interaction.timezone)}
      </td>
      <td className="px-4 py-3 text-sm">{interaction.timezone}</td>
      <td className="px-4 py-3 text-sm">
        {formatDateTime(interaction.endDateTime, interaction.timezone)}
      </td>
      <td className="px-4 py-3 text-sm">{interaction.location}</td>
      <td className="px-4 py-3 text-sm">
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleEditClick}
          data-testid="edit-button"
          aria-label={`Edit ${interaction.title}`}
        >
          Edit
        </Button>
      </td>
    </tr>
  );
};

export default InteractionTableRow;