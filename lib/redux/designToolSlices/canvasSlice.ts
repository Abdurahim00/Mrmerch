import { createSlice } from "@reduxjs/toolkit"

interface CanvasObject {
  id: string
  [key: string]: any
}

interface CanvasState {
  fabricCanvas: any
  objects: CanvasObject[]
  selectedObject: CanvasObject | null
  history: any[]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
  zoom: number
  isLoading: boolean
}

const initialState: CanvasState = {
  fabricCanvas: null,
  objects: [],
  selectedObject: null,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  zoom: 1,
  isLoading: false,
}

const canvasSlice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    setFabricCanvas: (state, action) => {
      state.fabricCanvas = action.payload
    },
    addObject: (state, action) => {
      state.objects.push(action.payload as CanvasObject)
    },
    removeObject: (state, action) => {
      state.objects = state.objects.filter((obj) => obj.id !== action.payload)
    },
    updateObject: (state, action) => {
      const index = state.objects.findIndex((obj) => obj.id === action.payload.id)
      if (index !== -1) {
        state.objects[index] = { ...state.objects[index], ...action.payload }
      }
    },
    setSelectedObject: (state, action) => {
      state.selectedObject = action.payload
    },
    addToHistory: (state, action) => {
      // Remove any history after current index
      state.history = state.history.slice(0, state.historyIndex + 1)
      state.history.push(action.payload)
      state.historyIndex = state.history.length - 1

      // Update undo/redo availability
      state.canUndo = state.historyIndex > 0
      state.canRedo = false

      // Limit history to prevent memory issues
      if (state.history.length > 50) {
        state.history = state.history.slice(-50)
        state.historyIndex = state.history.length - 1
      }
    },
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex -= 1
        state.canRedo = true
        state.canUndo = state.historyIndex > 0
      }
    },
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex += 1
        state.canUndo = true
        state.canRedo = state.historyIndex < state.history.length - 1
      }
    },
    setZoom: (state, action) => {
      state.zoom = action.payload
    },
    clearCanvas: (state) => {
      state.objects = []
      state.selectedObject = null
      state.history = []
      state.historyIndex = -1
      state.canUndo = false
      state.canRedo = false
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
  },
})

// Export the actions
export const {
  setFabricCanvas,
  addObject,
  removeObject,
  updateObject,
  setSelectedObject,
  addToHistory,
  undo,
  redo,
  setZoom,
  clearCanvas,
  setLoading,
} = canvasSlice.actions

// Create properly typed action creators for TypeScript
export const setFabricCanvasAction = (canvas: any) => setFabricCanvas(canvas);
export const addObjectAction = (object: CanvasObject) => addObject(object);
export const setSelectedObjectAction = (object: CanvasObject | null) => setSelectedObject(object);

export default canvasSlice.reducer
