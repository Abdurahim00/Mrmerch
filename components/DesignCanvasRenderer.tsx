"use client"

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'

interface DesignCanvasRendererProps {
  canvasJSON: any
  productImage: string
  angle: string
}

export function DesignCanvasRenderer({ canvasJSON, productImage, angle }: DesignCanvasRendererProps) {
  console.log(`[DesignCanvasRenderer] ${angle} - Component rendered with:`, {
    hasCanvasJSON: !!canvasJSON,
    objectsCount: canvasJSON?.objects?.length || 0,
    productImage: !!productImage
  })
  
  // Debug: Log the canvasJSON data being received
  console.log(`[DesignCanvasRenderer] ${angle} view - Received canvasJSON:`, {
    angle,
    productImage,
    hasCanvasJSON: !!canvasJSON,
    canvasJSONType: typeof canvasJSON,
    objectsCount: canvasJSON?.objects?.length || 0,
    canvasJSON: canvasJSON
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const fabricCanvasRef = useRef<any>(null)
  const [isRendered, setIsRendered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [fabricLoaded, setFabricLoaded] = useState(false)
  const [containerMounted, setContainerMounted] = useState(false)

  // Function to load fabric.js
  const loadFabric = useCallback(async () => {
    if (fabricLoaded) return
    
    try {
      console.log(`[DesignCanvasRenderer] ${angle} - Loading fabric.js...`)
      const fabricModule = await import('fabric')
      const fabric = fabricModule.default
      console.log(`[DesignCanvasRenderer] ${angle} - Fabric.js loaded successfully`)
      setFabricLoaded(true)
      return fabric
    } catch (err) {
      console.error(`[DesignCanvasRenderer] ${angle} - Failed to load fabric.js:`, err)
      setError(`Failed to load fabric.js: ${err}`)
      return null
    }
  }, [fabricLoaded, angle])

  // Function to initialize the canvas
  const initializeCanvas = useCallback(async () => {
    if (isInitializing) return
    
    const containerElement = containerRef.current
    if (!containerElement || !canvasJSON) {
      console.log(`[DesignCanvasRenderer] ${angle} - Cannot initialize:`, {
        hasContainerElement: !!containerElement,
        hasCanvasJSON: !!canvasJSON
      })
      return
    }

    // Check if there are any design objects to render
    const hasDesignObjects = canvasJSON?.objects && canvasJSON.objects.length > 0
    
    if (!hasDesignObjects) {
      console.log(`[DesignCanvasRenderer] ${angle} - No design objects to render, skipping canvas creation`)
      setIsRendered(true)
      return
    }

    setIsInitializing(true)
    console.log(`[DesignCanvasRenderer] ${angle} - Starting render process...`)

    try {
      // Load fabric.js if not already loaded
      const fabric = await loadFabric()
      if (!fabric) {
        setIsInitializing(false)
        return
      }

      console.log(`[DesignCanvasRenderer] ${angle} - Fabric.js imported successfully`)

      // Clean up any existing canvas
      const existingCanvas = containerElement.querySelector('canvas')
      if (existingCanvas) {
        containerElement.removeChild(existingCanvas)
      }

      // Create canvas element programmatically
      const canvasElement = document.createElement('canvas')
      canvasElement.width = 800
      canvasElement.height = 600
      canvasElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
        pointer-events: none;
      `
      
      console.log(`[DesignCanvasRenderer] ${angle} - Canvas element created:`, canvasElement)
      
      // Append canvas to container
      containerElement.appendChild(canvasElement)
      console.log(`[DesignCanvasRenderer] ${angle} - Canvas appended to container`)

      // Create Fabric.js canvas
      const canvas = new fabric.Canvas(canvasElement, {
        width: 800,
        height: 600,
        selection: false,
        interactive: false,
        renderOnAddRemove: false
      })

      console.log(`[DesignCanvasRenderer] ${angle} - Fabric.js canvas created:`, canvas)

      fabricCanvasRef.current = canvas

      // Load the canvas JSON data
      console.log(`[DesignCanvasRenderer] ${angle} - Loading canvasJSON data...`)
      
      canvas.loadFromJSON(canvasJSON, () => {
        try {
          console.log(`[DesignCanvasRenderer] ${angle} - CanvasJSON loaded successfully`)
          
          const objects = canvas.getObjects()
          console.log(`[DesignCanvasRenderer] ${angle} - Objects loaded:`, objects.length)
          
          if (objects.length > 0) {
            console.log(`[DesignCanvasRenderer] ${angle} - Processing ${objects.length} objects...`)

            // Scale and position objects to fit the product image
            const scale = 0.8 // Scale factor to fit design on product
            const centerX = 400 // Center of 800x600 canvas
            const centerY = 300

            objects.forEach((obj: any, index: number) => {
              if (obj) {
                console.log(`[DesignCanvasRenderer] ${angle} - Processing object ${index + 1}:`, {
                  type: obj.type,
                  originalLeft: obj.left,
                  originalTop: obj.top,
                  originalWidth: obj.width,
                  originalHeight: obj.height,
                  originalScaleX: obj.scaleX,
                  originalScaleY: obj.scaleY
                })
                
                // Scale the object
                obj.scaleX = (obj.scaleX || 1) * scale
                obj.scaleY = (obj.scaleY || 1) * scale
                
                // Center the object
                obj.left = centerX - (obj.width * obj.scaleX) / 2
                obj.top = centerY - (obj.height * obj.scaleY) / 2
                
                // Update text font size if it's a text object
                if (obj.type === 'text' && obj.fontSize) {
                  obj.fontSize = obj.fontSize * scale
                }
                
                console.log(`[DesignCanvasRenderer] ${angle} - Object ${index + 1} processed:`, {
                  newLeft: obj.left,
                  newTop: obj.top,
                  newScaleX: obj.scaleX,
                  newScaleY: obj.scaleY
                })
              }
            })
          }

          // Render the canvas
          console.log(`[DesignCanvasRenderer] ${angle} - Rendering canvas...`)
          canvas.renderAll()
          
          console.log(`[DesignCanvasRenderer] ${angle} - Canvas rendered successfully`)
          setIsRendered(true)
          setIsInitializing(false)

          if (process.env.NODE_ENV === 'development') {
            console.log(`[DesignCanvasRenderer] ${angle} rendered successfully:`, {
              objectsCount: objects.length,
              canvasElement: canvasElement
            })
          }
        } catch (err) {
          console.error(`[DesignCanvasRenderer] ${angle} - Error processing canvas objects:`, err)
          setError(`Error processing objects: ${err}`)
          setIsInitializing(false)
        }
      })

    } catch (err) {
      console.error(`[DesignCanvasRenderer] ${angle} - Error rendering design canvas:`, err)
      setError(`Failed to render design elements: ${err}`)
      setIsInitializing(false)
    }
  }, [canvasJSON, angle, isInitializing, loadFabric])

  // Ref callback to detect when DOM element is mounted
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log(`[DesignCanvasRenderer] ${angle} - Container ref callback: DOM element mounted, node:`, node)
      setContainerMounted(true)
      
      // If we have canvas data and the DOM is ready, initialize immediately
      if (canvasJSON && !isRendered && !isInitializing) {
        console.log(`[DesignCanvasRenderer] ${angle} - Container mounted, initializing canvas immediately`)
        setTimeout(() => initializeCanvas(), 50)
      }
    } else {
      console.log(`[DesignCanvasRenderer] ${angle} - Container ref callback: DOM element unmounted`)
      setContainerMounted(false)
    }
  }, [canvasJSON, angle, isRendered, isInitializing, initializeCanvas])

  // useLayoutEffect to see when DOM is ready and initialize canvas
  useLayoutEffect(() => {
    console.log(`[DesignCanvasRenderer] ${angle} - useLayoutEffect triggered, containerMounted:`, containerMounted)
    
    if (containerMounted && canvasJSON) {
      console.log(`[DesignCanvasRenderer] ${angle} - DOM ready, initializing canvas`)
      initializeCanvas()
    }
  }, [containerMounted, canvasJSON, angle, initializeCanvas])

  // Fallback useEffect in case useLayoutEffect doesn't work (e.g., in modals)
  useEffect(() => {
    if (!containerMounted || !canvasJSON) {
      console.log(`[DesignCanvasRenderer] ${angle} - Fallback useEffect: waiting for container or canvas data`)
      return
    }

    // If useLayoutEffect didn't work, try again after a longer delay
    const timer = setTimeout(() => {
      if (containerMounted && canvasJSON && !isRendered && !isInitializing) {
        console.log(`[DesignCanvasRenderer] ${angle} - Fallback useEffect: initializing canvas after delay`)
        initializeCanvas()
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [containerMounted, canvasJSON, angle, isRendered, isInitializing, initializeCanvas])

  // Additional effect to handle modal/dialog rendering
  useEffect(() => {
    // For components rendered in modals, we need to wait longer for the DOM to be ready
    const checkAndInitialize = () => {
      if (containerMounted && canvasJSON && !isRendered && !isInitializing) {
        console.log(`[DesignCanvasRenderer] ${angle} - Modal effect: DOM ready, initializing canvas`)
        initializeCanvas()
      }
    }

    // Check immediately
    checkAndInitialize()

    // Also check after a longer delay for modals
    const timer = setTimeout(checkAndInitialize, 500)

    // Use MutationObserver to detect when the DOM is actually ready
    let observer: MutationObserver | null = null
    if (typeof window !== 'undefined' && window.MutationObserver && containerRef.current) {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // DOM has changed, check if we can initialize
            setTimeout(checkAndInitialize, 100)
          }
        })
      })

      // Start observing
      observer.observe(containerRef.current, { childList: true, subtree: true })
    }

    return () => {
      clearTimeout(timer)
      if (observer) {
        observer.disconnect()
      }
    }
  }, [containerMounted, canvasJSON, angle, isRendered, isInitializing, initializeCanvas])

  // Cleanup effect
  useEffect(() => {
    return () => {
      console.log(`[DesignCanvasRenderer] ${angle} - Cleaning up...`)
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
      }
      // Clean up canvas element
      if (containerRef.current) {
        const canvasElement = containerRef.current.querySelector('canvas')
        if (canvasElement) {
          containerRef.current.removeChild(canvasElement)
        }
      }
    }
  }, [angle])

  if (error) {
    return (
      <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-600 dark:text-red-400">
          <div className="text-sm font-medium mb-1">Design Render Error</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    )
  }

  // Show loading state when initializing
  if (isInitializing) {
    return (
      <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg flex items-center justify-center">
        <div className="text-center text-blue-600 dark:text-blue-400">
          <div className="text-sm font-medium mb-1">Initializing Design...</div>
          <div className="text-xs">Setting up canvas</div>
        </div>
      </div>
    )
  }

  // Show loading state only when we have canvas data but haven't rendered yet
  if (canvasJSON && !isRendered) {
    return (
      <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg flex items-center justify-center">
        <div className="text-center text-blue-600 dark:text-blue-400">
          <div className="text-sm font-medium mb-1">Rendering Design...</div>
          <div className="text-xs">Loading design elements</div>
        </div>
      </div>
    )
  }

  // If no canvas data, don't show anything (let the parent handle the product image)
  if (!canvasJSON) {
    return null
  }

  // If there are no design objects, don't render anything (let the parent show just the product image)
  if (!canvasJSON?.objects || canvasJSON.objects.length === 0) {
    return null
  }

  // Always render the container div first, then the useEffect will handle the canvas creation
  return (
    <div 
      ref={setContainerRef}
      className="absolute inset-0 pointer-events-none"
    />
  )
}
