export { cn } from "cn"

export function escapeRegex(string = "") {
  if (!string || typeof string !== "string") return ""
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
