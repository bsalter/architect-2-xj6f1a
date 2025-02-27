// Import icons from react-icons/hi (Heroicons)
import {
  HiMenu,
  HiQuestionMarkCircle,
  HiPlus,
  HiChevronLeft,
  HiChevronRight,
  HiX,
  HiExclamation,
  HiInformationCircle,
  HiCog,
  HiUser,
  HiSearch,
  HiFilter,
  HiSortDescending,
  HiPencil,
  HiCalendar,
  HiClock,
  HiLocationMarker,
  HiCheck,
  HiExclamationCircle,
  HiChevronDown,
  HiChevronUp,
  HiLogout,
  HiOfficeBuilding
} from 'react-icons/hi'; // v4.7.1

// Import spinner icon from react-icons/fi (Feather icons)
import { FiLoader } from 'react-icons/fi'; // v4.7.1

// Re-export icons with descriptive names aligned with UI components
// Menu and Navigation Icons
export const MenuIcon = HiMenu; // Icon for the menu navigation component [#]
export const HelpIcon = HiQuestionMarkCircle; // Icon for help/information links [?]
export const AddIcon = HiPlus; // Icon for add/create functionality [+]
export const ChevronLeftIcon = HiChevronLeft; // Icon for left navigation/pagination [<]
export const ChevronRightIcon = HiChevronRight; // Icon for right navigation/pagination [>]
export const CloseIcon = HiX; // Icon for close/delete actions [x]

// Status and Information Icons
export const AlertIcon = HiExclamation; // Icon for alerts/warnings [!]
export const InfoIcon = HiInformationCircle; // Icon for information messages [i]
export const SettingsIcon = HiCog; // Icon for settings options [=]
export const UserIcon = HiUser; // Icon for user profile [@]

// Interaction Finder Icons
export const SearchIcon = HiSearch; // Icon for search functionality in the Finder view
export const FilterIcon = HiFilter; // Icon for filter controls in the Finder view
export const SortIcon = HiSortDescending; // Icon for sort functionality in tables
export const EditIcon = HiPencil; // Icon for edit actions on interactions

// Form Field Icons
export const CalendarIcon = HiCalendar; // Icon for date pickers in the Interaction form
export const ClockIcon = HiClock; // Icon for time pickers in the Interaction form
export const LocationIcon = HiLocationMarker; // Icon for location field in the Interaction form

// Feedback Icons
export const CheckIcon = HiCheck; // Icon for success states and checkboxes
export const ErrorIcon = HiExclamationCircle; // Icon for error messages and validation failures

// UI Component Icons
export const ChevronDownIcon = HiChevronDown; // Icon for dropdown menus including site selector
export const ChevronUpIcon = HiChevronUp; // Icon for collapsible panels
export const LogoutIcon = HiLogout; // Icon for logout functionality
export const SpinnerIcon = FiLoader; // Icon for loading states
export const SiteIcon = HiOfficeBuilding; // Icon representing sites in the site selector