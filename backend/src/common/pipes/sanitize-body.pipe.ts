import { Injectable, PipeTransform, ArgumentMetadata } from "@nestjs/common";

function sanitize(obj: any): any {
  if (obj === "") return undefined;
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      if (val === "") {
        delete obj[key];
      } else {
        obj[key] = sanitize(val);
      }
    });
  }
  return obj;
}

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata) {
    if (value && typeof value === "object") {
      sanitize(value);
    }
    return value;
  }
}

export default SanitizePipe;
