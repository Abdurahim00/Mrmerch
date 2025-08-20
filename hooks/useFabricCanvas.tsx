"use client"

import { useEffect, useRef, useCallback } from "react"
import * as fabric from "fabric"
import { useDispatch, useSelector } from "react-redux"
import { addToHistory, undo, redo } from "../lib/redux/designToolSlices/canvasSlice"
import { setSelectedTool } from "../lib/redux/designToolSlices/designSlice"
import { RootState } from "../lib/redux/store"

export const useFabricCanvas = (canvasId: string) => {
  const dispatch = useDispatch()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const { selectedObject, history, historyIndex } = useSelector((state: RootState) => state.canvas)
  const userId = useSelector((state: RootState) => (state as any).auth.user?.id) as string | undefined
  const { selectedTool } = useSelector((state: RootState) => state.design)

  // saveState accepts the canvas instance as an argument
  const saveState = useCallback(
    (canvasInstance: fabric.Canvas) => {
      if (canvasInstance) {
        const state = JSON.stringify(canvasInstance.toJSON())
        dispatch(addToHistory(state))
        // Persist latest canvas JSON for refresh recovery and also per product+angle for multi-angle autosave
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('designCanvasJSON', state)
            // Also persist per current product and view (angle)
            try {
              const sessionRaw = localStorage.getItem('designSessionState')
              if (sessionRaw) {
                const session = JSON.parse(sessionRaw)
                const pid = session?.selectedProduct?.id
                const angle = session?.viewMode
                if (pid && angle) {
                  const uid = userId || 'guest'
                  const key = `designCanvasJSON:${uid}:${pid}:${angle}`
                  localStorage.setItem(key, state)
                }
              }
            } catch {}
          }
        } catch {}
      }
    },
    [dispatch, userId],
  )

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: "transparent",
      selection: true,
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      imageSmoothingEnabled: true,
    })

    // --- Fabric.js v6 Global Control Configuration ---
    // Set global defaults for all interactive objects with modern styling
    fabric.InteractiveFabricObject.ownDefaults = {
      ...fabric.InteractiveFabricObject.ownDefaults,
      transparentCorners: false,
      cornerSize: 10, // Optimized corner size
      touchCornerSize: 16, // Better touch experience
      padding: 8, // Improved padding for better visual spacing
      borderColor: "#3b82f6", // Modern blue color
      hasBorders: true,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#3b82f6",
      cornerStyle: 'rect', // Simple rectangle corners like in image
      borderScaleFactor: 1.5, // Slightly thicker borders
      borderDashArray: [0], // Solid borders for cleaner look
    }

    // Helper function to draw rounded rectangle
    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
    }

    // Function to render delete icon (X) using Canvas API
    const renderDeleteIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, size: number) => {
      ctx.save()
      ctx.translate(left, top)
      
      // White background with border
      ctx.fillStyle = 'white'
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      drawRoundedRect(ctx, -size/2, -size/2, size, size, 6)
      ctx.fill()
      ctx.stroke()
      
      // X icon
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-6, -6)
      ctx.lineTo(6, 6)
      ctx.moveTo(6, -6)
      ctx.lineTo(-6, 6)
      ctx.stroke()
      
      ctx.restore()
    }

    // Function to render copy icon using Canvas API
    const renderCopyIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, size: number) => {
      ctx.save()
      ctx.translate(left, top)
      
      // White background with border
      ctx.fillStyle = 'white'
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      drawRoundedRect(ctx, -size/2, -size/2, size, size, 6)
      ctx.fill()
      ctx.stroke()
      
      // Copy icon - two overlapping rectangles
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      // Back rectangle
      ctx.strokeRect(-2, -2, 8, 8)
      // Front rectangle
      ctx.strokeRect(-6, -6, 8, 8)
      
      ctx.restore()
    }

    // Function to render rotate icon using Canvas API
    const renderRotateIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, size: number) => {
      ctx.save()
      ctx.translate(left, top)
      
      // White background with border
      ctx.fillStyle = 'white'
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      drawRoundedRect(ctx, -size/2, -size/2, size, size, 6)
      ctx.fill()
      ctx.stroke()
      
      // Rotate icon - circular arrow
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      // Draw circular arrow
      ctx.beginPath()
      ctx.arc(0, 0, 6, -Math.PI/2, Math.PI, false)
      ctx.stroke()
      
      // Arrow head
      ctx.beginPath()
      ctx.moveTo(-4, 4)
      ctx.lineTo(-6, 6)
      ctx.lineTo(-2, 6)
      ctx.stroke()
      
      ctx.restore()
    }

    // Define custom controls globally for all objects - positioned exactly like the image
    fabric.InteractiveFabricObject.ownDefaults.controls = {
      // Copy control - positioned top-left close to delete (like in image)
      copyControl: new fabric.Control({
        x: -0.5,
        y: -0.5,
        offsetY: -12,
        offsetX: -12,
        cursorStyle: "pointer",
        mouseUpHandler: async (eventData: any, transform: any) => {
          const target = transform.target
          const canvas = target.canvas
          if (canvas) {
            const cloned = await target.clone()
            cloned.set({
              left: (target.left || 0) + 20,
              top: (target.top || 0) + 20,
            })
            canvas.add(cloned)
            canvas.setActiveObject(cloned)
            canvas.requestRenderAll()
            setTimeout(() => saveState(canvas), 50)
          }
          return true
        },
        render: (ctx: any, left: any, top: any, styleOverride: any, fabricObject: any) => {
          const size = 32
          // Add shadow for depth
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
          ctx.shadowBlur = 8
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 2
          renderCopyIcon(ctx, left, top, size)
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        },
      } as any),

      // Delete control - positioned top-right close to copy (like in image)
      deleteControl: new fabric.Control({
        x: 0.5,
        y: -0.5,
        offsetY: -12,
        offsetX: 12,
        cursorStyle: "pointer",
        mouseUpHandler: (eventData: any, transform: any) => {
          const target = transform.target
          const canvas = target.canvas
          if (canvas) {
            canvas.remove(target)
            canvas.requestRenderAll()
            // Set selected object to null via Redux
            dispatch({ type: 'canvas/setSelectedObject', payload: null })
            setTimeout(() => saveState(canvas), 50)
          }
          return true
        },
        render: (ctx: any, left: any, top: any, styleOverride: any, fabricObject: any) => {
          const size = 32
          // Add shadow for depth
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
          ctx.shadowBlur = 8
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 2
          renderDeleteIcon(ctx, left, top, size)
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        },
      } as any),

      // Rotate control - positioned bottom center opposite to top controls (like in image)
      mtr: new fabric.Control({
        x: 0,
        y: 0.5,
        offsetY: 20,
        cursorStyle: "crosshair",
        actionHandler: fabric.controlsUtils.rotationWithSnapping,
        actionName: "rotate",
        render: (ctx: any, left: any, top: any, styleOverride: any, fabricObject: any) => {
          const size = 32
          // Add shadow for depth
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
          ctx.shadowBlur = 8
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 2
          renderRotateIcon(ctx, left, top, size)
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        },
      } as any),

      // Simple corner controls for resizing (like in your image)
      tl: new fabric.Control({
        x: -0.5,
        y: -0.5,
        cursorStyle: "nw-resize",
        actionHandler: fabric.controlsUtils.scalingEqually,
        actionName: "scaling",
      }),
      tr: new fabric.Control({
        x: 0.5,
        y: -0.5,
        cursorStyle: "ne-resize",
        actionHandler: fabric.controlsUtils.scalingEqually,
        actionName: "scaling",
      }),
      bl: new fabric.Control({
        x: -0.5,
        y: 0.5,
        cursorStyle: "sw-resize",
        actionHandler: fabric.controlsUtils.scalingEqually,
        actionName: "scaling",
      }),
      br: new fabric.Control({
        x: 0.5,
        y: 0.5,
        cursorStyle: "se-resize",
        actionHandler: fabric.controlsUtils.scalingEqually,
        actionName: "scaling",
      }),

      // Hide middle controls for cleaner interface
      ml: new fabric.Control({ visible: false }),
      mr: new fabric.Control({ visible: false }),
      mt: new fabric.Control({ visible: false }),
      mb: new fabric.Control({ visible: false }),
    }

    // Function to apply text scaling behavior
    const applyTextScalingBehavior = (textObj: fabric.IText) => {
      // Remove any existing scaling listeners to prevent duplicates
      textObj.off('scaling')
      textObj.off('modified')
      
      // Add scaling event listener
      textObj.on('scaling', function(e: any) {
        const obj = e.target as fabric.IText & { minFontSize?: number; maxFontSize?: number; _originalFontSize?: number }
        if (!obj) return

        // Store original font size if not already stored
        if (!obj._originalFontSize) {
          obj._originalFontSize = obj.fontSize || 24
        }

        // Calculate the scale factor (use the average of scaleX and scaleY for uniform scaling)
        const scaleX = obj.scaleX || 1
        const scaleY = obj.scaleY || 1
        const scale = Math.min(scaleX, scaleY) // Use minimum to maintain readability
        
        // Calculate new font size based on scale
        const newFontSize = Math.round(obj._originalFontSize * scale)
        
        // Apply constraints
        const minSize = obj.minFontSize || 8
        const maxSize = obj.maxFontSize || 200
        const constrainedFontSize = Math.max(minSize, Math.min(newFontSize, maxSize))
        
        // Update font size
        obj.set('fontSize', constrainedFontSize)
        
        // Reset scale to 1 to prevent compound scaling issues
        obj.set({
          scaleX: 1,
          scaleY: 1,
        })
        
        // Force canvas re-render
        canvas.requestRenderAll()
      })

      // Handle when scaling is finished
      textObj.on('modified', function(e: any) {
        const obj = e.target as fabric.IText & { _originalFontSize?: number }
        if (!obj) return
        
        // Update the original font size to the new font size
        obj._originalFontSize = obj.fontSize || 24
        
        // Save state after scaling is complete
        setTimeout(() => saveState(canvas), 100)
      })
    }

    // Helper function to update tool based on object type
    const updateToolBasedOnObjectType = (obj: any) => {
      // Set the selected tool based on object type
      if (obj.type === "i-text" || obj.type === "text") {
        dispatch(setSelectedTool("text"));
      } else if (obj.type === "image") {
        // Check if it's a template or uploaded image
        if (obj.isTemplate) {
          dispatch(setSelectedTool("template"));
        } else {
          dispatch(setSelectedTool("upload"));
        }
      } else {
        // For other object types, keep current tool
      }
    };

    // Canvas event listeners
    canvas.on("selection:created", (e) => {
      if (e.selected && e.selected[0]) {
        const selectedObj = e.selected[0];
        // Dispatch action directly
        dispatch({ type: 'canvas/setSelectedObject', payload: selectedObj });
        updateToolBasedOnObjectType(selectedObj);
        
        // Apply text resizing behavior to selected text objects
        if (selectedObj.type === "i-text" || selectedObj.type === "text") {
          const textObj = selectedObj as fabric.IText;
          applyTextScalingBehavior(textObj);
        }
      }
    });

    canvas.on("selection:updated", (e) => {
      if (e.selected && e.selected[0]) {
        const selectedObj = e.selected[0];
        // Dispatch action directly
        dispatch({ type: 'canvas/setSelectedObject', payload: selectedObj });
        updateToolBasedOnObjectType(selectedObj);
        
        // Apply text resizing behavior to selected text objects
        if (selectedObj.type === "i-text" || selectedObj.type === "text") {
          const textObj = selectedObj as fabric.IText;
          applyTextScalingBehavior(textObj);
        }
      }
    });

    canvas.on("selection:cleared", () => {
      dispatch({ type: 'canvas/setSelectedObject', payload: null });
      // Default to product tool when nothing is selected
      dispatch(setSelectedTool("product"));
    });

    canvas.on("object:modified", () => {
      setTimeout(() => saveState(canvas), 50)
    })

    canvas.on("text:changed", () => {
      canvas.requestRenderAll()
      setTimeout(() => saveState(canvas), 50)
    })

    // Double click to edit text
    canvas.on("mouse:dblclick", (e) => {
      if (e.target && e.target.type === "i-text") {
        const textObj = e.target as fabric.IText
        textObj.enterEditing()
        textObj.selectAll()
      }
    })

    fabricCanvasRef.current = canvas
    
    // Set the fabric canvas in Redux
    dispatch({ type: 'canvas/setFabricCanvas', payload: canvas });
    
    // Make the canvas instance globally available for other functions
    (window as any).fabricCanvas = canvas

    // Save initial state
    setTimeout(() => saveState(canvas), 100)

    return canvas
  }, [dispatch, saveState])

  // addText now accepts the canvas instance as its first argument
  const addText = useCallback(
    (canvasInstance: fabric.Canvas, text = "Your text here", options: any = {}) => {
      const textObj = new fabric.IText(text, {
        left: 150,
        top: 150,
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#000000",
        editable: true,
        selectable: true,
        evented: true,
        originX: "center",
        originY: "center",
        // Enable scaling for text
        lockUniScaling: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,
        // Minimum and maximum font size constraints
        minFontSize: 8,
        maxFontSize: 200,
        // Store original font size for scaling calculations
        _originalFontSize: 24,
        ...options,
      }) as fabric.IText & { minFontSize?: number; maxFontSize?: number; _originalFontSize?: number }

      // Apply scaling behavior
      textObj.on('scaling', function(e: any) {
        const obj = e.target as fabric.IText & { minFontSize?: number; maxFontSize?: number; _originalFontSize?: number }
        if (!obj) return

        // Store original font size if not already stored
        if (!obj._originalFontSize) {
          obj._originalFontSize = obj.fontSize || 24
        }

        // Calculate the scale factor
        const scaleX = obj.scaleX || 1
        const scaleY = obj.scaleY || 1
        const scale = Math.min(scaleX, scaleY)
        
        // Calculate new font size based on scale
        const newFontSize = Math.round(obj._originalFontSize * scale)
        
        // Apply constraints
        const minSize = obj.minFontSize || 8
        const maxSize = obj.maxFontSize || 200
        const constrainedFontSize = Math.max(minSize, Math.min(newFontSize, maxSize))
        
        // Update font size and reset scale
        obj.set({
          fontSize: constrainedFontSize,
          scaleX: 1,
          scaleY: 1,
        })
        
        canvasInstance.requestRenderAll()
      })

      textObj.on('modified', function(e: any) {
        const obj = e.target as fabric.IText & { _originalFontSize?: number }
        if (!obj) return
        
        // Update the original font size to the new font size
        obj._originalFontSize = obj.fontSize || 24
        
        setTimeout(() => saveState(canvasInstance), 100)
      })

      canvasInstance.add(textObj)
      canvasInstance.setActiveObject(textObj)
      canvasInstance.requestRenderAll()

      // Update Redux state directly
      dispatch({ type: 'canvas/setSelectedObject', payload: textObj });
      dispatch(setSelectedTool("text"))

      setTimeout(() => {
        if (textObj.enterEditing) {
          textObj.enterEditing()
          textObj.selectAll()
        }
      }, 100)

      // Add object to Redux store
      dispatch({ 
        type: 'canvas/addObject', 
        payload: {
          id: Date.now().toString(),
          type: "text",
          object: textObj,
        }
      });

      setTimeout(() => saveState(canvasInstance), 150)

      return textObj
    },
    [dispatch, saveState],
  )
 

  // deleteSelected now accepts the canvas instance as its first argument
  const deleteSelected = useCallback(
    (canvasInstance: fabric.Canvas) => {
      const activeObject = canvasInstance.getActiveObject()
      if (activeObject) {
        canvasInstance.remove(activeObject)
        canvasInstance.requestRenderAll()
        dispatch({ type: 'canvas/setSelectedObject', payload: null })
        setTimeout(() => saveState(canvasInstance), 50)
      }
    },
    [dispatch, saveState],
  )

  // duplicateSelected now accepts the canvas instance as its first argument
  const duplicateSelected = useCallback(
    async (canvasInstance: fabric.Canvas) => {
      const activeObject = canvasInstance.getActiveObject()
      if (activeObject) {
        const cloned = await activeObject.clone()
        
        // Preserve the isTemplate flag if it exists
        if ((activeObject as any).isTemplate !== undefined) {
          (cloned as any).isTemplate = (activeObject as any).isTemplate;
        }
        
        cloned.set({
          left: (activeObject.left || 0) + 30,
          top: (activeObject.top || 0) + 30,
        })
        
        // If it's a text object, apply scaling behavior to the clone
        if (cloned.type === "i-text" || cloned.type === "text") {
          const textClone = cloned as fabric.IText & { minFontSize?: number; maxFontSize?: number; _originalFontSize?: number }
          textClone._originalFontSize = textClone.fontSize || 24
          
          textClone.on('scaling', function(e: any) {
            const obj = e.target as fabric.IText & { minFontSize?: number; maxFontSize?: number; _originalFontSize?: number }
            if (!obj) return

            if (!obj._originalFontSize) {
              obj._originalFontSize = obj.fontSize || 24
            }

            const scaleX = obj.scaleX || 1
            const scaleY = obj.scaleY || 1
            const scale = Math.min(scaleX, scaleY)
            
            const newFontSize = Math.round(obj._originalFontSize * scale)
            const minSize = obj.minFontSize || 8
            const maxSize = obj.maxFontSize || 200
            const constrainedFontSize = Math.max(minSize, Math.min(newFontSize, maxSize))
            
            obj.set({
              fontSize: constrainedFontSize,
              scaleX: 1,
              scaleY: 1,
            })
            
            canvasInstance.requestRenderAll()
          })

          textClone.on('modified', function(e: any) {
            const obj = e.target as fabric.IText & { _originalFontSize?: number }
            if (!obj) return
            obj._originalFontSize = obj.fontSize || 24
            setTimeout(() => saveState(canvasInstance), 100)
          })
        }
        
        canvasInstance.add(cloned)
        canvasInstance.setActiveObject(cloned)
        canvasInstance.requestRenderAll()
        setTimeout(() => saveState(canvasInstance), 50)
      }
    },
    [saveState],
  )

  // updateTextProperties now accepts the canvas instance as its first argument
  const updateTextProperties = useCallback(
    (canvasInstance: fabric.Canvas, properties: any) => {
      const activeObject = canvasInstance.getActiveObject()
      if (activeObject && (activeObject.type === "text" || activeObject.type === "i-text")) {
        const textObj = activeObject as fabric.IText & { minFontSize?: number; maxFontSize?: number; _originalFontSize?: number }
        
        // Apply font size constraints if fontSize is being updated
        if (properties.fontSize !== undefined) {
          const constrainedFontSize = Math.max(
            textObj.minFontSize || 8,
            Math.min(properties.fontSize, textObj.maxFontSize || 200)
          )
          properties.fontSize = constrainedFontSize
          // Update the original font size for scaling calculations
          textObj._originalFontSize = constrainedFontSize
        }
        
        activeObject.set(properties)
        canvasInstance.requestRenderAll()
        setTimeout(() => saveState(canvasInstance), 50)
      }
    },
    [saveState],
  )

  // getTextScalingInfo - Get information about text scaling constraints
  const getTextScalingInfo = useCallback(
    (canvasInstance: fabric.Canvas) => {
      const activeObject = canvasInstance.getActiveObject()
      if (activeObject && (activeObject.type === "text" || activeObject.type === "i-text")) {
        const textObj = activeObject as fabric.IText & { minFontSize?: number; maxFontSize?: number }
        return {
          currentFontSize: textObj.fontSize || 24,
          minFontSize: textObj.minFontSize || 8,
          maxFontSize: textObj.maxFontSize || 200,
          scaleX: textObj.scaleX || 1,
          scaleY: textObj.scaleY || 1,
        }
      }
      return null
    },
    [],
  )

  // handleUndo now accepts the canvas instance as its first argument
  const handleUndo = useCallback(
    (canvasInstance: fabric.Canvas) => {
      if (!history.length || historyIndex <= 0) return
      const prevIndex = historyIndex - 1
      const prevState = history[prevIndex]

      if (prevState) {
        dispatch(undo())
        canvasInstance.loadFromJSON(JSON.parse(prevState), () => {
          canvasInstance.requestRenderAll()
          dispatch({ type: 'canvas/setSelectedObject', payload: null })
        })
      }
    },
    [dispatch, history, historyIndex],
  )

  // handleRedo now accepts the canvas instance as its first argument
  const handleRedo = useCallback(
    (canvasInstance: fabric.Canvas) => {
      if (!history.length || historyIndex >= history.length - 1) return
      const nextIndex = historyIndex + 1
      const nextState = history[nextIndex]

      if (nextState) {
        dispatch(redo())
        canvasInstance.loadFromJSON(JSON.parse(nextState), () => {
          canvasInstance.requestRenderAll()
          dispatch({ type: 'canvas/setSelectedObject', payload: null })
        })
      }
    },
    [dispatch, history, historyIndex],
  )

  // clearCanvas now accepts the canvas instance as its first argument
  const clearCanvas = useCallback(
    (canvasInstance: fabric.Canvas) => {
      canvasInstance.clear()
      canvasInstance.requestRenderAll()
      dispatch({ type: 'canvas/setSelectedObject', payload: null })
      setTimeout(() => saveState(canvasInstance), 50)
    },
    [dispatch, saveState],
  )

  // exportCanvas now accepts the canvas instance as its first argument
  const exportCanvas = useCallback((canvasInstance: fabric.Canvas, format: any = "png") => {
    return canvasInstance.toDataURL({
      format,
      quality: 1,
      multiplier: 2,
    })
  }, [])

  // Text bending/curving functionality - simplified approach
  const bendText = useCallback((canvasInstance: fabric.Canvas, bendAmount: number = 0) => {
    if (!canvasInstance) return

    const activeObject = canvasInstance.getActiveObject()
    if (!activeObject || (activeObject.type !== "text" && activeObject.type !== "i-text")) return

    const textObj = activeObject as fabric.IText

    // Simple text transformation using skew for bend effect
    if (bendAmount !== 0) {
      // Apply skew transformation for bending effect
      const skewValue = bendAmount * 0.5 // Scale down the bend amount
      textObj.set({
        skewX: skewValue,
        // Store bend amount for tracking
        _bendAmount: bendAmount,
      } as any)
    } else {
      // Reset to normal text
      textObj.set({
        skewX: 0,
        _bendAmount: 0,
      } as any)
    }
    
    canvasInstance.requestRenderAll()
    setTimeout(() => saveState(canvasInstance), 50)
  }, [saveState])

  // Get current bend amount for selected text
  const getTextBendAmount = useCallback((canvasInstance: fabric.Canvas) => {
    if (!canvasInstance) return 0

    const activeObject = canvasInstance.getActiveObject()
    if (!activeObject || (activeObject.type !== "text" && activeObject.type !== "i-text")) return 0

    return (activeObject as any)._bendAmount || 0
  }, [])

  useEffect(() => {
    const canvas = initCanvas()

    return () => {
      if (canvas) {
        canvas.dispose()
      }
    }
  }, [initCanvas])

  // Load canvas from JSON
  const loadFromJSON = useCallback((json: any) => {
    // Access the fabric canvas instance from the global window object
    const fabricCanvas = (window as any).fabricCanvas
    if (!fabricCanvas) {
      console.warn('Fabric canvas not available for loading')
      return
    }
    
    try {
      console.log('Loading canvas from JSON:', json)
      
      fabricCanvas.clear()
      
      // Load from JSON with custom property preservation
      fabricCanvas.loadFromJSON(json, () => {
        console.log('Canvas loaded from JSON, processing objects...')
        
        // After loading the canvas, make sure all objects have proper event handlers and custom properties
        fabricCanvas.getObjects().forEach((obj: fabric.Object, index: number) => {
          console.log(`Processing object ${index}:`, obj.type, obj)
          
          // Restore custom properties that might have been lost
          const objData = json.objects?.[index]
          if (objData) {
            // Restore custom properties
            if (objData.isTemplate !== undefined) {
              (obj as any).isTemplate = objData.isTemplate
            }
            if (objData._originalFontSize !== undefined) {
              (obj as any)._originalFontSize = objData._originalFontSize
            }
            if (objData._bendAmount !== undefined) {
              (obj as any)._bendAmount = objData._bendAmount
            }
            if (objData.minFontSize !== undefined) {
              (obj as any).minFontSize = objData.minFontSize
            }
            if (objData.maxFontSize !== undefined) {
              (obj as any).maxFontSize = objData.maxFontSize
            }
          }
          
          // Check if it's a text object and apply special text scaling behavior
          if (obj.type === "i-text" || obj.type === "text") {
            const textObj = obj as fabric.IText & { minFontSize?: number; maxFontSize?: number; _originalFontSize?: number; _bendAmount?: number }
            
            // Ensure original font size is set
            if (textObj._originalFontSize === undefined) {
              textObj._originalFontSize = textObj.fontSize || 24
            }
            
            // Set default constraints if not present
            if (textObj.minFontSize === undefined) {
              textObj.minFontSize = 8
            }
            if (textObj.maxFontSize === undefined) {
              textObj.maxFontSize = 200
            }
            
            // Remove any existing event listeners to prevent duplicates
            textObj.off('scaling')
            textObj.off('modified')
            
            // Apply the text scaling behavior
            textObj.on('scaling', function(e: any) {
              const target = e.target as fabric.IText & { minFontSize?: number; maxFontSize?: number; _originalFontSize?: number }
              if (!target) return
      
              if (!target._originalFontSize) {
                target._originalFontSize = target.fontSize || 24
              }
      
              const scaleX = target.scaleX || 1
              const scaleY = target.scaleY || 1
              const scale = Math.min(scaleX, scaleY)
              
              const newFontSize = Math.round(target._originalFontSize * scale)
              const minSize = target.minFontSize || 8
              const maxSize = target.maxFontSize || 200
              const constrainedFontSize = Math.max(minSize, Math.min(newFontSize, maxSize))
              
              target.set({
                fontSize: constrainedFontSize,
                scaleX: 1,
                scaleY: 1,
              })
              
              fabricCanvas.requestRenderAll()
            })
            
            // Handle when scaling is finished
            textObj.on('modified', function(e: any) {
              const target = e.target as fabric.IText & { _originalFontSize?: number }
              if (!target) return
              
              // Update the original font size to the new font size
              target._originalFontSize = target.fontSize || 24
              
              // Save state after scaling is complete
              setTimeout(() => saveState(fabricCanvas), 100)
            })
            
            console.log('Applied text scaling behavior to text object:', textObj.text)
          }
          
          // For image objects, ensure they have proper properties
          if (obj.type === "image") {
            const imageObj = obj as fabric.Image & { isTemplate?: boolean }
            console.log('Loaded image object:', { isTemplate: imageObj.isTemplate, src: (imageObj as any).src })
          }
        })
        
        console.log('All objects processed, rendering canvas')
        fabricCanvas.renderAll()
        
        // Set the active object to null initially
        fabricCanvas.discardActiveObject()
        fabricCanvas.requestRenderAll()
        
        // Save the initial state after loading
        setTimeout(() => {
          saveState(fabricCanvas)
          console.log('Canvas state saved after loading')
        }, 100)
      })
    } catch (error) {
      console.error('Error loading canvas from JSON:', error)
      // Try to display a user-friendly error
      if (fabricCanvas) {
        fabricCanvas.clear()
        fabricCanvas.requestRenderAll()
      }
    }
  }, [saveState])

    // Add image to canvas
  const addImage = useCallback(
    (canvasInstance: fabric.Canvas, imageUrl: string, options: any = {}) => {
      // Use regular JS Image to load first to avoid TypeScript issues with fabric.Image.fromURL
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        // Create fabric image from the loaded JS image
        const fabricImage = new fabric.Image(img, {
          left: 150,
          top: 150,
          originX: "center",
          originY: "center",
          ...options
        });
        
        // Scale the image to fit within a reasonable size while maintaining aspect ratio
        const maxDimension = 250; // Maximum width or height
        if (fabricImage.width && fabricImage.height) {
          if (fabricImage.width > fabricImage.height) {
            if (fabricImage.width > maxDimension) {
              fabricImage.scaleToWidth(maxDimension);
            }
          } else {
            if (fabricImage.height > maxDimension) {
              fabricImage.scaleToHeight(maxDimension);
            }
          }
        }
        
        // Add the image to the canvas
        canvasInstance.add(fabricImage);
        canvasInstance.setActiveObject(fabricImage);
        canvasInstance.requestRenderAll();
        
        // Dispatch to Redux store
        dispatch({
          type: 'canvas/setSelectedObject',
          payload: fabricImage
        });
        
        // Save canvas state
        setTimeout(() => saveState(canvasInstance), 50);
      };
      
      img.src = imageUrl;
    },
    [dispatch, saveState],
  );

  return {
    canvasRef,
    addText,
    addImage,
    deleteSelected,
    duplicateSelected,
    updateTextProperties,
    getTextScalingInfo,
    handleUndo,
    handleRedo,
    clearCanvas,
    exportCanvas,
    bendText,
    getTextBendAmount,
    loadFromJSON
  }
}