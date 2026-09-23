import { statusPill } from '../styles/admin'

export function statusClass(status: string) {
  const key = status.toLowerCase()
  if (['new', 'pending', 'draft', 'submitted'].includes(key)) {
    return `${statusPill} bg-[#e8f1ff] text-[#2563eb] dark:bg-blue-600/20 dark:text-[#93c5fd]`
  }
  if (['paid', 'verified', 'enrolled', 'completed', 'active', 'converted'].includes(key)) {
    return `${statusPill} bg-[#e7f8ef] text-[#16a34a] dark:bg-green-600/20 dark:text-[#86efac]`
  }
  if (['contacted', 'in review', 'partial', 'counselling', 'processing'].includes(key)) {
    return `${statusPill} bg-[#eee8ff] text-[#7c3aed] dark:bg-violet-600/20 dark:text-[#c4b5fd]`
  }
  if (['overdue', 'rejected', 'lost', 'failed', 'cancelled'].includes(key)) {
    return `${statusPill} bg-[#ffe8ee] text-[#e11d48] dark:bg-rose-600/20 dark:text-[#fda4af]`
  }
  if (['follow-up', 'interested', 'offer sent', 'due soon'].includes(key)) {
    return `${statusPill} bg-[#fff1e6] text-[#d97706] dark:bg-amber-600/20 dark:text-[#fcd34d]`
  }
  return `${statusPill} bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]`
}
