import { builders as b, AST } from '@glimmer/syntax';
import { buildAttrContent, AppendableToAttrContent } from '../html';
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

export default function interpolateProperties(interpolation: string, { divisor = ':', skipIfMissing = true } = {}) {
  let parts = splitInterpolation(interpolation, divisor);
  return function _interpolate(this: BuildTimeComponent) {
    let concatParts: AppendableToAttrContent[] = [];
    let hasDynamicInterpolation = false;
    let missingInterpolationValues = false;
    for (let part of parts) {
      if (part[0] === divisor && part[part.length - 1] === divisor) {
        let propName = part.slice(1, part.length - 1);
        let attrValue = this.invocationAttrs[propName];
        let value;
        if (this[`${propName}Content`] && this[`${propName}Content`] !== _interpolate) {
          value = this[`${propName}Content`]();
        } else if (attrValue) {
          value = attrValue;
        } else if (this.options.hasOwnProperty(propName)) {
          value = this.options[propName];
        } else if (this.hasOwnProperty(propName)) {
          value = this[propName];
        }
        if (skipIfMissing && value === null || value === undefined || value.type === 'UndefinedLiteral' || value.type === 'NullLiteral') {
          missingInterpolationValues = true;
        } else {
          concatParts.push(value);
        }
      } else {
        concatParts.push(part);
      }
    }
    if (!missingInterpolationValues || !skipIfMissing) {
      return buildAttrContent(concatParts);
    }
  }
}
