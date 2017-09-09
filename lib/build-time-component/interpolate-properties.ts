import { builders as b, AST } from '@glimmer/syntax';
import BuildTimeComponent from '../build-time-component';

function splitInterpolation(interpolation: string, divisor: string): string[] {
  let parts: string[] = [];
  let lastMatch = 0;
  let inCaptureGroup = false;
  for(let i = 0; i < interpolation.length; i++) {
    if (interpolation[i] === divisor) {
      parts.push(interpolation.slice(lastMatch, i + (inCaptureGroup ? 1 : 0)));
      inCaptureGroup = !inCaptureGroup
      lastMatch = i + (inCaptureGroup ? 0 : 1);
    }
  }
  if (lastMatch < interpolation.length - 1) {
    parts.push(interpolation.slice(lastMatch, interpolation.length));
  }
  if (parts[0] === '') {
    return parts.slice(1);
  }
  return parts;
}

type ConcatPart = AST.MustacheStatement | AST.TextNode;

export default function interpolateProperties(interpolation: string, divisor = ':') {
  let parts = splitInterpolation(interpolation, divisor);
  return function(this: BuildTimeComponent) {
    let concatParts: (ConcatPart | string)[] = [];
    let hasDynamicInterpolation = false;
    for (let part of parts) {
      if (part[0] === divisor && part[part.length - 1] === divisor) {
        let propName = part.slice(1, part.length - 1);
        let attrValue = this.attrs[propName];
        if (attrValue) {
          if (attrValue.type === 'PathExpression') {
            hasDynamicInterpolation = true;
            concatParts.push(b.mustache(attrValue));
          } else if (attrValue.type === 'SubExpression') {
            hasDynamicInterpolation = true;
            concatParts.push(b.mustache(attrValue.path, attrValue.params));
          } else if (attrValue.value !== undefined && attrValue.value !== null) {
            concatParts.push(String(attrValue.value));
          }
        } else {
          console.log('try to read value from defaults');
        }
      } else {
        concatParts.push(part);
      }
    }
    if (hasDynamicInterpolation) {
      return b.concat(<ConcatPart[]>concatParts.filter((s) => typeof s === 'string' ? b.text(s): s));
    } else {
      return concatParts.join('');
    }
  }
}
