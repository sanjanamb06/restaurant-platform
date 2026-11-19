export function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
