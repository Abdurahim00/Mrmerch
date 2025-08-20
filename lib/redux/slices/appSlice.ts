import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Language } from "@/types"

interface AppState {
  language: Language
  uploadedDesignForCar: string | null
  appliedCategoryDesigns?: Record<string, string | null>
}

const initialState: AppState = {
  language: "en",
  uploadedDesignForCar: null,
  appliedCategoryDesigns: {},
}

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload
    },
    setUploadedDesignForCar: (state, action: PayloadAction<string | null>) => {
      state.uploadedDesignForCar = action.payload
    },
    setAppliedCategoryDesign: (
      state,
      action: PayloadAction<{ categoryId: string; designId: string | null }>,
    ) => {
      if (!state.appliedCategoryDesigns) state.appliedCategoryDesigns = {}
      state.appliedCategoryDesigns[action.payload.categoryId] = action.payload.designId
    },
  },
})

export const { setLanguage, setUploadedDesignForCar, setAppliedCategoryDesign } = appSlice.actions
export default appSlice.reducer
