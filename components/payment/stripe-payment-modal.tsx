"use client"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ShieldCheck, CreditCard, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  currency: string
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
  orderData: any
}

function PaymentForm({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
  onClose,
  orderData,
}: {
  amount: number
  currency: string
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
  onClose: () => void
  orderData: any
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setMessage("")

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: "if_required",
      })

      if (error) {
        setMessage(error.message || "An error occurred during payment.")
        onPaymentError(error.message || "Payment failed")
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment.",
          variant: "destructive",
        })
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setMessage("Payment successful!")
        onPaymentSuccess(paymentIntent.id)
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
          variant: "success",
        })
        onClose()
      }
    } catch (error) {
      console.error("Payment error:", error)
      setMessage("An unexpected error occurred.")
      onPaymentError("An unexpected error occurred")
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Secure Payment
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your payment is protected by Stripe
              </p>
            </div>
          </div>
          <ShieldCheck className="h-5 w-5 text-green-600" />
        </div>

        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: {
              billingDetails: {
                name: orderData?.customerName || "",
                email: orderData?.customerEmail || "",
              },
            },
          }}
        />
      </div>

      {message && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
        </div>
      )}

      <div className="space-y-4">
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900 dark:text-white">
            Total Amount:
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {amount.toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-sky-600 hover:bg-sky-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Pay {amount.toFixed(2)} {currency.toUpperCase()}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export default function StripePaymentModal({
  isOpen,
  onClose,
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
  orderData,
}: StripePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && amount > 0) {
      createPaymentIntent()
    }
  }, [isOpen, amount])

  const createPaymentIntent = async () => {
    setIsLoading(true)
    try {
      // Make sure amount is a valid number
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid payment amount: ${amount}. Please check your cart for correct pricing.`);
      }
      
      console.log("Creating payment intent with amount:", amount);
      
      const response = await fetch("/api/payment/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          currency,
          metadata: {
            orderId: orderData?.orderId || "no-order-id",
            customerEmail: orderData?.customerEmail || "no-email",
            customerName: orderData?.customerName || "no-name",
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Payment intent creation failed:", data);
        throw new Error(data.error || "Failed to create payment intent")
      }

      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error("Error creating payment intent:", error)
      onPaymentError(error instanceof Error ? error.message : "Payment setup failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Complete Payment
            </DialogTitle>
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Setting up payment...
                  </span>
                </div>
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#0284c7",
                      colorBackground: "#ffffff",
                      colorText: "#1e293b",
                      colorDanger: "#ef4444",
                      fontFamily: "Inter, system-ui, sans-serif",
                      spacingUnit: "4px",
                      borderRadius: "8px",
                    },
                  },
                }}
              >
                <PaymentForm
                  amount={amount}
                  currency={currency}
                  onPaymentSuccess={onPaymentSuccess}
                  onPaymentError={onPaymentError}
                  onClose={onClose}
                  orderData={orderData}
                />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    Failed to initialize payment
                  </p>
                  <Button
                    onClick={createPaymentIntent}
                    className="mt-2"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
} 