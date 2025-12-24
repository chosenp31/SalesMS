import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Display ID generation utilities
// Format: C001-01 (deal), C001-01-01 (contract)

function formatCustomerId(customerNumber: number | undefined): string {
  if (!customerNumber) return "-";
  return `C${String(customerNumber).padStart(3, "0")}`;
}

export function formatDealId(
  customerNumber: number | undefined,
  dealNumber: number | undefined
): string {
  if (!customerNumber || !dealNumber) return "-";
  return `${formatCustomerId(customerNumber)}-${String(dealNumber).padStart(2, "0")}`;
}

export function formatContractId(
  customerNumber: number | undefined,
  dealNumber: number | undefined,
  contractNumber: number | undefined
): string {
  if (!customerNumber || !dealNumber || !contractNumber) return "-";
  return `${formatDealId(customerNumber, dealNumber)}-${String(contractNumber).padStart(2, "0")}`;
}
