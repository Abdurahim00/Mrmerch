import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./slices/authSlice"
import cartSlice from "./slices/cartSlice"
import productsSlice from "./slices/productsSlice"
import ordersSlice from "./slices/ordersSlice"
import appSlice from "./slices/appSlice"
import usersSlice from "./slices/usersSlice" // New
import designsSlice from "./slices/designsSlice" // New
import templatesSlice from "./slices/templatesSlice" // New
import couponsSlice from "./slices/couponsSlice" // New
import categoriesSlice from "./slices/categoriesSlice" // New

import designReducer from "@/lib/redux/designToolSlices/designSlice"
import productsReducer from "@/lib/redux/designToolSlices/productsSlice"
import templatesReducer from "@/lib/redux/designToolSlices/templatesSlice"
import canvasReducer from "@/lib/redux/designToolSlices/canvasSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cart: cartSlice,
    products: productsSlice,
    orders: ordersSlice,
    app: appSlice,
    users: usersSlice, // Added
    designs: designsSlice, // Added
    templatesManagement: templatesSlice, // Added
    coupons: couponsSlice, // Added
    categories: categoriesSlice, // Added
    // favorites removed

    design: designReducer,
    designProducts: productsReducer,
    templates: templatesReducer,
    canvas: canvasReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["canvas/setFabricCanvas", "canvas/addObject"],
        ignoredPaths: ["canvas.fabricCanvas", "canvas.objects"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
