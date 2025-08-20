import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface OrderItem {
  name: string
  quantity: number
  price: number
  size?: string
  designPreview?: string
  designId?: string
  selectedSizes?: any[]
  designContext?: any
  designCanvasJSON?: any
  productId?: string
}

interface Order {
  id: string
  customer: string
  date: string
  total: number
  status: string
  items: OrderItem[]
  shippingOption: string
  paymentMethod: string
  paymentIntentId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  customerCity?: string
  customerPostalCode?: string
  customerCountry?: string
}

export function generateOrderPDF(order: Order): jsPDF {
  const doc = new jsPDF()
  
  // Set document properties
  doc.setProperties({
    title: `Order ${order.id} - PrintWrap Pro`,
    subject: `Order Details for ${order.id}`,
    author: 'PrintWrap Pro Admin',
    creator: 'PrintWrap Pro System'
  })

  // Company Header
  doc.setFillColor(99, 76, 158) // Purple brand color
  doc.rect(0, 0, 210, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('PrintWrap Pro', 20, 20)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Professional Print Solutions', 20, 30)
  
  // Order Header
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`Order ${order.id}`, 20, 50)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${order.date}`, 20, 65)
  doc.text(`Status: ${order.status}`, 20, 75)
  
  // Customer Information Section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Customer Information', 20, 95)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  let yPos = 105
  
  if (order.customerName) {
    doc.text(`Name: ${order.customerName}`, 20, yPos)
    yPos += 8
  }
  
  doc.text(`Customer ID: ${order.customer}`, 20, yPos)
  yPos += 8
  
  if (order.customerEmail) {
    doc.text(`Email: ${order.customerEmail}`, 20, yPos)
    yPos += 8
  }
  
  if (order.customerPhone) {
    doc.text(`Phone: ${order.customerPhone}`, 20, yPos)
    yPos += 8
  }
  
  if (order.customerAddress) {
    const address = [
      order.customerAddress,
      order.customerCity,
      order.customerPostalCode,
      order.customerCountry
    ].filter(Boolean).join(', ')
    
    doc.text(`Address: ${address}`, 20, yPos)
    yPos += 8
  }
  
  // Order Summary
  yPos += 10
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Order Summary', 20, yPos)
  
  yPos += 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Amount: ${order.total.toFixed(2)} SEK`, 20, yPos)
  yPos += 8
  doc.text(`Payment Method: ${order.paymentMethod}`, 20, yPos)
  yPos += 8
  doc.text(`Shipping: ${order.shippingOption}`, 20, yPos)
  
  // Products and Designs Section
  yPos += 15
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Products & Designs', 20, yPos)
  
  yPos += 15
  
  // Process each item
  order.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    // Item Header
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${item.name}`, 20, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Quantity: ${item.quantity}`, 20, yPos)
    yPos += 6
    doc.text(`Price: ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price} SEK`, 20, yPos)
    yPos += 6
    doc.text(`Total: ${typeof item.price === 'number' ? (item.price * item.quantity).toFixed(2) : 'N/A'} SEK`, 20, yPos)
    yPos += 6
    
    // Size breakdown
    if (item.selectedSizes && item.selectedSizes.length > 0) {
      const sizeBreakdown = item.selectedSizes.map((s: any) => `${s.size} × ${s.quantity}`).join(', ')
      doc.text(`Sizes: ${sizeBreakdown}`, 20, yPos)
      yPos += 6
    }
    
    // Design Context
    if (item.designContext) {
      yPos += 5
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Design Details:', 20, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`View Mode: ${item.designContext.viewMode}`, 25, yPos)
      yPos += 6
      doc.text(`Product Color: ${item.designContext.productColor}`, 25, yPos)
      yPos += 6
      
      // Template information
      if (item.designContext.selectedTemplate) {
        doc.text(`Template: ${item.designContext.selectedTemplate.name}`, 25, yPos)
        yPos += 6
        doc.text(`Template Category: ${item.designContext.selectedTemplate.category}`, 25, yPos)
        yPos += 6
        doc.text(`Template Price: ${item.designContext.selectedTemplate.price === 'free' ? 'Free' : `${item.designContext.selectedTemplate.price} SEK`}`, 25, yPos)
        yPos += 6
      }
      
      // Variation details
      if (item.designContext.selectedVariation) {
        doc.text(`Variation Color: ${item.designContext.selectedVariation.colorName}`, 25, yPos)
        yPos += 6
        doc.text(`Color Code: ${item.designContext.selectedVariation.colorHexCode}`, 25, yPos)
        yPos += 6
        
        // Available angles with design status
        if (item.designContext.selectedVariation.variationImages && item.designContext.selectedVariation.variationImages.length > 0) {
          yPos += 3
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text('Product Angles:', 25, yPos)
          yPos += 6
          
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          
          item.designContext.selectedVariation.variationImages.forEach((img: any, imgIndex: number) => {
            const isCurrentView = img.angle === item.designContext.viewMode
            const hasDesign = item.designCanvasJSON
            
            let angleText = `${img.angle.toUpperCase()}: ${img.angle} view`
            if (isCurrentView) {
              angleText += ' (CURRENT DESIGN VIEW)'
            }
            if (hasDesign) {
              angleText += ' ✓ Design Applied'
            }
            
            doc.text(angleText, 30, yPos)
            yPos += 5
          })
          
          yPos += 3
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.text(`Current Design View: ${item.designContext.viewMode}`, 25, yPos)
          yPos += 6
          
          if (item.designCanvasJSON) {
            doc.text('✓ Design elements have been applied to this view', 25, yPos)
            yPos += 6
          }
        }
      }
    }
    
    // Design Preview (if available)
    if (item.designPreview) {
      yPos += 5
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Design Preview Available', 20, yPos)
      yPos += 8
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Final design image is included in the system', 25, yPos)
      yPos += 6
    }
    
    // Design Canvas Data
    if (item.designCanvasJSON) {
      yPos += 5
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Design Canvas Data Available', 20, yPos)
      yPos += 8
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Complete design specifications are stored for production', 25, yPos)
      yPos += 6
    }
    
    yPos += 10
  })
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Page number
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
    
    // Footer line
    doc.setDrawColor(99, 76, 158)
    doc.setLineWidth(0.5)
    doc.line(20, 280, 190, 280)
    
    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(99, 76, 158)
    doc.text('PrintWrap Pro - Professional Print Solutions', 105, 285, { align: 'center' })
    doc.text('Generated on: ' + new Date().toLocaleString(), 105, 290, { align: 'center' })
  }
  
  return doc
}

export function downloadOrderPDF(order: Order, filename?: string): void {
  try {
    const doc = generateOrderPDF(order)
    const defaultFilename = `order-${order.id}-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF')
  }
}
