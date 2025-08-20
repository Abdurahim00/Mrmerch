"use client"

import { useState, useRef, useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { setUploadedDesignForCar } from "@/lib/redux/slices/appSlice"
import { translations, carDatabase } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import { useToast } from "@/hooks/use-toast"
import { Car, Search, Upload, Download, Save, Palette, Move, ZoomIn, ZoomOut, Grid, Eye } from "lucide-react"
import Image from "next/image"

interface WrapDesign {
  id: string
  image: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  blendMode: string
}

export default function CarMockupPage() {
  const dispatch = useAppDispatch()
  const { language, uploadedDesignForCar } = useAppSelector((state) => state.app)
  const { user } = useAppSelector((state) => state.auth)
  const t = translations[language]
  const { toast } = useToast()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [licensePlate, setLicensePlate] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [wrapDesigns, setWrapDesigns] = useState<WrapDesign[]>([])
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null)
  const [designName, setDesignName] = useState("Car Wrap Design")
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [canvasSize] = useState({ width: 1000, height: 600 })

  // Design upload
  const [uploadedDesign, setUploadedDesign] = useState("")

  useEffect(() => {
    if (uploadedDesignForCar) {
      setUploadedDesign(uploadedDesignForCar)
    }
  }, [uploadedDesignForCar])

  useEffect(() => {
    drawCanvas()
  }, [selectedVehicle, wrapDesigns, selectedDesign, showGrid, zoom])

  const findVehicle = () => {
    const plate = licensePlate.toUpperCase().trim()
    if (!plate) {
      toast({
        title: "Error",
        description: "Please enter a license plate number.",
        variant: "destructive",
      })
      return
    }

    const vehicle = carDatabase[plate as keyof typeof carDatabase]
    if (vehicle) {
      setSelectedVehicle({ ...vehicle, plate })
      toast({
        title: "Vehicle Found!",
        description: `Found ${vehicle.make} ${vehicle.model}`,
        variant: "success",
      })
    } else {
      toast({
        title: "Vehicle Not Found",
        description: "Using default vehicle template. In a real system, this would connect to vehicle databases.",
        variant: "destructive",
      })
      // Use default vehicle
      setSelectedVehicle({
        make: "Generic",
        model: "Vehicle",
        plate,
        svgPath: "/placeholder.svg?height=400&width=800&text=Vehicle+Mockup",
      })
    }
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply zoom
    ctx.save()
    ctx.scale(zoom, zoom)

    // Draw background
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(0, 0, canvas.width / zoom, canvas.height / zoom)

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "#e2e8f0"
      ctx.lineWidth = 1
      const gridSize = 20
      for (let x = 0; x <= canvas.width / zoom; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height / zoom)
        ctx.stroke()
      }
      for (let y = 0; y <= canvas.height / zoom; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width / zoom, y)
        ctx.stroke()
      }
    }

    // Draw vehicle mockup
    if (selectedVehicle) {
      const vehicleImg = new Image()
      vehicleImg.crossOrigin = "anonymous"
      vehicleImg.onload = () => {
        const vehicleWidth = 600
        const vehicleHeight = 300
        const vehicleX = (canvas.width / zoom - vehicleWidth) / 2
        const vehicleY = (canvas.height / zoom - vehicleHeight) / 2

        ctx.drawImage(vehicleImg, vehicleX, vehicleY, vehicleWidth, vehicleHeight)

        // Draw wrap designs on top of vehicle
        wrapDesigns.forEach((design) => {
          const designImg = new Image()
          designImg.crossOrigin = "anonymous"
          designImg.onload = () => {
            ctx.save()
            ctx.globalAlpha = design.opacity
            ctx.globalCompositeOperation = design.blendMode as GlobalCompositeOperation

            ctx.translate(design.x + design.width / 2, design.y + design.height / 2)
            ctx.rotate((design.rotation * Math.PI) / 180)
            ctx.translate(-design.width / 2, -design.height / 2)

            ctx.drawImage(designImg, 0, 0, design.width, design.height)

            // Draw selection border
            if (selectedDesign === design.id) {
              ctx.globalAlpha = 1
              ctx.globalCompositeOperation = "source-over"
              ctx.strokeStyle = "#3b82f6"
              ctx.lineWidth = 2
              ctx.setLineDash([5, 5])
              ctx.strokeRect(-2, -2, design.width + 4, design.height + 4)
              ctx.setLineDash([])
            }

            ctx.restore()
          }
          designImg.src = design.image
        })
      }
      vehicleImg.src = selectedVehicle.svgPath
    }

    ctx.restore()
  }

  const applyDesignToWrap = () => {
    if (!uploadedDesign) {
      toast({
        title: "Error",
        description: "Please upload a design first.",
        variant: "destructive",
      })
      return
    }

    if (!selectedVehicle) {
      toast({
        title: "Error",
        description: "Please select a vehicle first.",
        variant: "destructive",
      })
      return
    }

    const newDesign: WrapDesign = {
      id: `wrap-${Date.now()}`,
      image: uploadedDesign,
      x: 200,
      y: 150,
      width: 300,
      height: 200,
      rotation: 0,
      opacity: 0.8,
      blendMode: "multiply",
    }

    setWrapDesigns([...wrapDesigns, newDesign])
    setSelectedDesign(newDesign.id)
    dispatch(setUploadedDesignForCar(uploadedDesign))

    toast({
      title: "Design Applied",
      description: "Your design has been applied to the vehicle wrap.",
      variant: "success",
    })
  }

  const updateSelectedDesign = (updates: Partial<WrapDesign>) => {
    if (!selectedDesign) return

    setWrapDesigns(wrapDesigns.map((design) => (design.id === selectedDesign ? { ...design, ...updates } : design)))
  }

  const removeSelectedDesign = () => {
    if (!selectedDesign) return

    setWrapDesigns(wrapDesigns.filter((design) => design.id !== selectedDesign))
    setSelectedDesign(null)

    toast({
      title: "Design Removed",
      description: "The selected design has been removed from the wrap.",
      variant: "success",
    })
  }

  const saveWrapDesign = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to save your design.",
        variant: "destructive",
      })
      return
    }

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const preview = canvas.toDataURL("image/png")

      const designData = {
        name: designName,
        type: "Car Wrap",
        preview,
        userId: user.id,
        designData: {
          vehicle: selectedVehicle,
          wrapDesigns,
          canvasSize,
        },
      }

      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(designData),
      })

      if (response.ok) {
        toast({
          title: "Design Saved",
          description: `"${designName}" has been saved to your designs.`,
          variant: "success",
        })
      } else {
        throw new Error("Failed to save design")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save design. Please try again.",
        variant: "destructive",
      })
    }
  }

  const exportDesign = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `${designName}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()

    toast({
      title: "Design Exported",
      description: "Your car wrap design has been exported as PNG.",
      variant: "success",
    })
  }

  const selectedDesignData = wrapDesigns.find((design) => design.id === selectedDesign)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{t.carWrapDesigner}</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
          Design professional car wraps with vehicle-specific templates and precision tools.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Vehicle Selection */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Swedish License Plate</Label>
                <div className="flex gap-2">
                  <Input
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="ABC 123"
                    maxLength={7}
                  />
                  <Button onClick={findVehicle} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedVehicle && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </span>
                    <Badge variant="outline">{selectedVehicle.plate}</Badge>
                  </div>
                  <div className="relative w-full h-20 bg-white rounded border">
                    <Image
                      src={selectedVehicle.svgPath || "/placeholder.svg"}
                      alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Design Name</Label>
                <Input
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  placeholder="Enter design name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Design Upload */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Design Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload label="Upload Design" value={uploadedDesign} onChange={setUploadedDesign} accept="image/*" />

              <Button onClick={applyDesignToWrap} className="w-full" disabled={!uploadedDesign || !selectedVehicle}>
                <Palette className="mr-2 h-4 w-4" />
                Apply to Vehicle
              </Button>
            </CardContent>
          </Card>

          {/* Design Properties */}
          {selectedDesignData && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Move className="h-5 w-5" />
                  Design Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>X Position</Label>
                    <Input
                      type="number"
                      value={selectedDesignData.x}
                      onChange={(e) => updateSelectedDesign({ x: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Y Position</Label>
                    <Input
                      type="number"
                      value={selectedDesignData.y}
                      onChange={(e) => updateSelectedDesign({ y: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Width</Label>
                    <Input
                      type="number"
                      value={selectedDesignData.width}
                      onChange={(e) => updateSelectedDesign({ width: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Height</Label>
                    <Input
                      type="number"
                      value={selectedDesignData.height}
                      onChange={(e) => updateSelectedDesign({ height: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Rotation (degrees)</Label>
                  <Input
                    type="number"
                    value={selectedDesignData.rotation}
                    onChange={(e) => updateSelectedDesign({ rotation: Number(e.target.value) })}
                    min="0"
                    max="360"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Opacity</Label>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedDesignData.opacity}
                    onChange={(e) => updateSelectedDesign({ opacity: Number(e.target.value) })}
                  />
                  <div className="text-xs text-slate-500 text-center">
                    {Math.round(selectedDesignData.opacity * 100)}%
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Blend Mode</Label>
                  <Select
                    value={selectedDesignData.blendMode}
                    onValueChange={(value) => updateSelectedDesign({ blendMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="multiply">Multiply</SelectItem>
                      <SelectItem value="screen">Screen</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                      <SelectItem value="soft-light">Soft Light</SelectItem>
                      <SelectItem value="hard-light">Hard Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="destructive" onClick={removeSelectedDesign} className="w-full">
                  Remove Design
                </Button>
              </CardContent>
            </Card>
          )}

          {/* View Controls */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                View Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Grid</Label>
                <Button variant={showGrid ? "default" : "outline"} size="sm" onClick={() => setShowGrid(!showGrid)}>
                  <Grid className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Zoom Level</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-mono min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    disabled={zoom >= 2}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vehicle Mockup</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveWrapDesign}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Design
                </Button>
                <Button variant="outline" onClick={exportDesign}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                <div className="overflow-auto max-h-[600px]">
                  <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="border border-slate-300 bg-white cursor-crosshair mx-auto block"
                    onClick={(e) => {
                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (!rect) return

                      const x = (e.clientX - rect.left) / zoom
                      const y = (e.clientY - rect.top) / zoom

                      // Find clicked design
                      const clickedDesign = wrapDesigns.find(
                        (design) =>
                          x >= design.x &&
                          x <= design.x + design.width &&
                          y >= design.y &&
                          y <= design.y + design.height,
                      )

                      setSelectedDesign(clickedDesign?.id || null)
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Click on designs to select them. Use the properties panel to modify selected designs.
                </div>

                {selectedVehicle && (
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Bleed Guidelines: 3mm
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Print Resolution: 300 DPI
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Vehicle: {selectedVehicle.make} {selectedVehicle.model}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle>Car Wrap Design Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Design Requirements:</h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    <li>• Minimum 300 DPI resolution</li>
                    <li>• CMYK color mode for printing</li>
                    <li>• 3mm bleed area around edges</li>
                    <li>• Vector graphics preferred</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Installation Notes:</h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    <li>• Consider vehicle curves and contours</li>
                    <li>• Account for door handles and mirrors</li>
                    <li>• Test print small sections first</li>
                    <li>• Professional installation recommended</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
