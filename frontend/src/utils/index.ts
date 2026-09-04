export function createPageUrl(pageName: string) {
  return "/" + pageName.replace(/ /g, "-");
}

export { formatDateOnly } from "./DateUtils";
