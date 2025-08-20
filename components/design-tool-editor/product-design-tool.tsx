"use client"

import { Provider } from "react-redux"
import { store } from "@/lib/redux/store"
import { DesignToolContainer } from "./design-tool/design-tool-container"

export function ProductDesignTool() {
  return (
    <Provider store={store}>
      <DesignToolContainer />
    </Provider>
  )
}
