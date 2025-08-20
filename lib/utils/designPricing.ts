/**
 * Utility functions for calculating design element costs
 */

export interface DesignElementCosts {
  templateCost: number;
  totalCost: number;
  breakdown: {
    template: { name: string; cost: number };
    elements: Array<{ type: string; name: string; cost: number }>;
  };
}

/**
 * Calculate the total cost of design elements
 * @param selectedTemplate - The selected template with price information
 * @param fabricCanvas - The Fabric.js canvas to analyze for paid elements
 * @returns Object containing cost breakdown
 */
export function calculateDesignElementCosts(
  selectedTemplate: any,
  fabricCanvas: any
): DesignElementCosts {
  let templateCost = 0;
  const elements: Array<{ type: string; name: string; cost: number }> = [];
  
  // Calculate template cost
  if (selectedTemplate) {
    if (selectedTemplate.price === "free") {
      templateCost = 0;
    } else if (typeof selectedTemplate.price === "number") {
      templateCost = selectedTemplate.price;
    } else if (typeof selectedTemplate.price === "string") {
      templateCost = parseFloat(selectedTemplate.price) || 0;
    }
  }
  
  // Analyze canvas for paid elements (future enhancement)
  // This could include premium fonts, stock images, etc.
  if (fabricCanvas) {
    const canvasObjects = fabricCanvas.getObjects();
    
    canvasObjects.forEach((obj: any) => {
      // Check for premium elements (this is a placeholder for future implementation)
      if (obj.isPremiumElement) {
        elements.push({
          type: obj.type || 'unknown',
          name: obj.name || 'Premium Element',
          cost: obj.premiumCost || 0
        });
      }
    });
  }
  
  const totalElementsCost = elements.reduce((sum, element) => sum + element.cost, 0);
  const totalCost = templateCost + totalElementsCost;
  
  return {
    templateCost,
    totalCost,
    breakdown: {
      template: {
        name: selectedTemplate?.name || 'No Template',
        cost: templateCost
      },
      elements
    }
  };
}

/**
 * Format price with currency
 * @param price - The price to format
 * @param currency - Currency code (default: 'kr')
 * @returns Formatted price string
 */
export function formatDesignPrice(price: number, currency: string = 'kr'): string {
  return `${Math.round(price)} ${currency}`;
}

/**
 * Check if a design has paid elements
 * @param costs - The design element costs
 * @returns Boolean indicating if there are paid elements
 */
export function hasPaidElements(costs: DesignElementCosts): boolean {
  return costs.totalCost > 0;
}
