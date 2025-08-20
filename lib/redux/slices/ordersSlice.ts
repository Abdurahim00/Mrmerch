import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { Order } from "@/types"

interface OrdersState {
  items: Order[]
  loading: boolean
  error: string | null
}

const initialState: OrdersState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchOrders = createAsyncThunk("orders/fetchOrders", async () => {
  const response = await fetch("/api/orders")
  if (!response.ok) {
    throw new Error("Failed to fetch orders")
  }
  return response.json()
})

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData: Omit<Order, "id" | "date" | "createdAt" | "updatedAt">) => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    })
    if (!response.ok) {
      throw new Error("Failed to create order")
    }
    return response.json()
  },
)

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ id, status }: { id: string; status: Order["status"] }) => {
    const response = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      throw new Error("Failed to update order status")
    }
    return response.json()
  },
)

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch orders"
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.items.unshift(action.payload) // Add new order to the beginning
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
  },
})

export default ordersSlice.reducer
