export type PaymentRow = Record<string, string>

export type PaymentFormValues = {
  invoice: string
  payer: string
  type: string
  amount: string
}
