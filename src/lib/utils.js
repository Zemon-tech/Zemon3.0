import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Dynamically import a Lucide icon by name
 * @param {string} iconName - Name of the Lucide icon to import
 * @returns {Promise<Component>} - The imported icon component
 */
export async function dynamicIconImport(iconName) {
  try {
    // Import the icon dynamically from lucide-react
    const icons = await import('lucide-react');
    return icons[iconName] || icons.Search; // Default to Search icon if not found
  } catch (error) {
    console.error(`Error importing icon ${iconName}:`, error);
    return null;
  }
} 