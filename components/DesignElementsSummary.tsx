"use client"

import { useMemo } from 'react'
import { Text, Image as ImageIcon, Square, Circle, Triangle } from 'lucide-react'

interface DesignElementsSummaryProps {
  canvasJSON: any
}

export function DesignElementsSummary({ canvasJSON }: DesignElementsSummaryProps) {
  const designElements = useMemo(() => {
    if (!canvasJSON || !canvasJSON.objects) return []
    
    return canvasJSON.objects.map((obj: any) => {
      const element = {
        type: obj.type || 'unknown',
        id: obj.id || `element_${Date.now()}`,
        properties: {
          left: obj.left || 0,
          top: obj.top || 0,
          width: obj.width || 0,
          height: obj.height || 0,
          scaleX: obj.scaleX || 1,
          scaleY: obj.scaleY || 1,
          angle: obj.angle || 0,
          fill: obj.fill || '#000000',
          stroke: obj.stroke || 'none',
          strokeWidth: obj.strokeWidth || 0,
          fontSize: obj.fontSize || 12,
          fontFamily: obj.fontFamily || 'Arial',
          fontWeight: obj.fontWeight || 'normal',
          fontStyle: obj.fontStyle || 'normal',
          text: obj.text || '',
          src: obj.src || '',
          isTemplate: obj.isTemplate || false
        }
      }
      
      return element
    })
  }, [canvasJSON])

  const elementCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    designElements.forEach((element: any) => {
      counts[element.type] = (counts[element.type] || 0) + 1
    })
    return counts
  }, [designElements])

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Text className="h-4 w-4" />
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'rect':
        return <Square className="h-4 w-4" />
      case 'circle':
        return <Circle className="h-4 w-4" />
      case 'triangle':
        return <Triangle className="h-4 w-4" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  const getElementColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'text-blue-600 dark:text-blue-400'
      case 'image':
        return 'text-green-600 dark:text-green-400'
      case 'rect':
        return 'text-purple-600 dark:text-purple-400'
      case 'circle':
        return 'text-orange-600 dark:text-orange-400'
      case 'triangle':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (designElements.length === 0) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
          No design elements found in this view
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Element Counts Summary */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(elementCounts).map(([type, count]) => (
          <div key={type} className="flex items-center gap-2 text-sm">
            <div className={`${getElementColor(type)}`}>
              {getElementIcon(type)}
            </div>
            <span className="text-slate-700 dark:text-slate-300 capitalize">
              {type}: {count}
            </span>
          </div>
        ))}
      </div>

      {/* Detailed Element List */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {designElements.slice(0, 5).map((element: any, index: number) => (
          <div key={element.id} className="bg-white dark:bg-slate-600/30 rounded p-2 border border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <div className={`${getElementColor(element.type)}`}>
                {getElementIcon(element.type)}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                {element.type} #{index + 1}
              </span>
            </div>
            
            {/* Element Properties */}
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              {element.type === 'text' && element.properties.text && (
                <div className="truncate">
                  <span className="font-medium">Text:</span> "{element.properties.text}"
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="font-medium">Position:</span> ({Math.round(element.properties.left)}, {Math.round(element.properties.top)})
                </div>
                <div>
                  <span className="font-medium">Size:</span> {Math.round(element.properties.width)} × {Math.round(element.properties.height)}
                </div>
              </div>
              
              {element.properties.fontSize && (
                <div>
                  <span className="font-medium">Font:</span> {element.properties.fontSize}px {element.properties.fontFamily}
                </div>
              )}
              
              {element.properties.fill && element.properties.fill !== '#000000' && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Color:</span>
                  <div 
                    className="w-4 h-4 rounded border border-slate-300"
                    style={{ backgroundColor: element.properties.fill }}
                  />
                  <span className="text-xs">{element.properties.fill}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {designElements.length > 5 && (
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">
            +{designElements.length - 5} more elements
          </div>
        )}
      </div>

      {/* Total Summary */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
        <div className="text-sm text-slate-700 dark:text-slate-300">
          <span className="font-medium">Total Elements:</span> {designElements.length}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          All elements positioned and sized for production
        </div>
      </div>
    </div>
  )
}
