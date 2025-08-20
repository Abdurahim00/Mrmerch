"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus } from "lucide-react"
import { SizePrice } from "@/lib/models/Product"

interface SizePriceEditorProps {
  value: SizePrice[]
  onChange: (sizes: SizePrice[]) => void
  basePrice: number
}

// Default sizes
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"]

export function SizePriceEditor({ value = [], onChange, basePrice = 0 }: SizePriceEditorProps) {
  const [sizes, setSizes] = useState<SizePrice[]>(value)
  
  // Initialize with default sizes if empty
  useEffect(() => {
    if (value.length === 0) {
      const defaultSizes = DEFAULT_SIZES.map(size => ({
        size,
        price: basePrice,
        inStock: true,
        stockQuantity: 100
      }))
      setSizes(defaultSizes)
      onChange(defaultSizes)
    } else {
      setSizes(value)
    }
  }, [])
  
  // Update sizes when value changes externally
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(sizes)) {
      setSizes(value)
    }
  }, [value])
  
  // Handle price change for a specific size
  const handlePriceChange = (index: number, price: number) => {
    const updatedSizes = [...sizes]
    updatedSizes[index] = {
      ...updatedSizes[index],
      price,
      // Track if this is a custom price or using base price
      useBasePrice: price === basePrice
    }
    setSizes(updatedSizes)
    onChange(updatedSizes)
  }
  
  // Reset price to base price
  const resetToBasePrice = (index: number) => {
    const updatedSizes = [...sizes]
    updatedSizes[index] = {
      ...updatedSizes[index],
      price: basePrice,
      useBasePrice: true
    }
    setSizes(updatedSizes)
    onChange(updatedSizes)
  }
  
  // Handle stock status change
  const handleStockStatusChange = (index: number, inStock: boolean) => {
    const updatedSizes = [...sizes]
    updatedSizes[index] = {
      ...updatedSizes[index],
      inStock
    }
    setSizes(updatedSizes)
    onChange(updatedSizes)
  }
  
  // Handle stock quantity change
  const handleStockQuantityChange = (index: number, quantity: number) => {
    const updatedSizes = [...sizes]
    updatedSizes[index] = {
      ...updatedSizes[index],
      stockQuantity: Math.max(0, quantity)
    }
    setSizes(updatedSizes)
    onChange(updatedSizes)
  }
  
  // Add a custom size
  const addCustomSize = () => {
    const newSize: SizePrice = {
      size: "Custom",
      price: basePrice,
      inStock: true,
      stockQuantity: 100
    }
    const updatedSizes = [...sizes, newSize]
    setSizes(updatedSizes)
    onChange(updatedSizes)
  }
  
  // Remove a size
  const removeSize = (index: number) => {
    const updatedSizes = sizes.filter((_, i) => i !== index)
    setSizes(updatedSizes)
    onChange(updatedSizes)
  }
  
  // Update size name
  const handleSizeNameChange = (index: number, sizeName: string) => {
    const updatedSizes = [...sizes]
    updatedSizes[index] = {
      ...updatedSizes[index],
      size: sizeName
    }
    setSizes(updatedSizes)
    onChange(updatedSizes)
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Size-Based Pricing</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addCustomSize}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Size
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/6">Size</TableHead>
              <TableHead className="w-1/4">Price (kr)</TableHead>
              <TableHead className="w-1/6">Base Price</TableHead>
              <TableHead className="w-1/6">In Stock</TableHead>
              <TableHead className="w-1/6">Quantity</TableHead>
              <TableHead className="w-1/12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sizes.map((sizeItem, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={sizeItem.size}
                    onChange={(e) => handleSizeNameChange(index, e.target.value)}
                    className="h-8 w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={sizeItem.price}
                    onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                    className="h-8 w-full"
                    min="0"
                    step="0.01"
                    disabled={sizeItem.useBasePrice}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={sizeItem.useBasePrice || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          resetToBasePrice(index);
                        } else {
                          // When unchecking, keep the current price but mark as custom
                          const updatedSizes = [...sizes];
                          updatedSizes[index] = {
                            ...updatedSizes[index],
                            useBasePrice: false
                          };
                          setSizes(updatedSizes);
                          onChange(updatedSizes);
                        }
                      }}
                    />
                    <span className="text-xs text-gray-500">
                      {sizeItem.useBasePrice ? "Yes" : "No"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={sizeItem.inStock}
                      onCheckedChange={(checked) => handleStockStatusChange(index, checked)}
                    />
                    <span className="text-sm text-gray-500">
                      {sizeItem.inStock ? "Yes" : "No"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={sizeItem.stockQuantity}
                    onChange={(e) => handleStockQuantityChange(index, parseInt(e.target.value) || 0)}
                    className="h-8 w-full"
                    min="0"
                    disabled={!sizeItem.inStock}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSize(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-gray-500">
        Set different prices for each size. If a size is not in stock, customers won't be able to select it.
      </div>
    </div>
  )
}