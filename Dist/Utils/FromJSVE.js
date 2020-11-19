/* eslint-disable */
export function E(e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17, e18, e19, e20) {
    var result = {};
    for (var extend of arguments) {
        Object.assign(result, extend);
    }
    return result;
    //return StyleSheet.create(result);
}
/* eslint-enable */
export function ToJSON(obj) { return JSON.stringify(obj); }
export function FromJSON(json) { return JSON.parse(json); }
export function RemoveDuplicates(items) {
    var result = [];
    for (const item of items) {
        if (result.indexOf(item) == -1) {
            result.push(item);
        }
    }
    return result;
}
export function Assert(condition, messageOrMessageFunc) {
    if (condition)
        return;
    var message = messageOrMessageFunc instanceof Function ? messageOrMessageFunc() : messageOrMessageFunc;
    //console.log(`Assert failed) ${message}\n\nStackTrace) ${GetStackTraceStr()}`);
    console.error(`Assert failed) ${message}`);
    debugger;
    throw new Error(`Assert failed) ${message}`);
}
export function AssertWarn(condition, messageOrMessageFunc) {
    if (condition)
        return;
    var message = messageOrMessageFunc instanceof Function ? messageOrMessageFunc() : messageOrMessageFunc;
    console.warn(`Assert-warn failed) ${message}\n\nStackTrace)`); // ${GetStackTraceStr()}`);
}
function IsArrayOfStrings(obj) { return obj instanceof Array && obj.every(a => IsString(a)); }
function IsString(obj) { return typeof obj == "string"; }
export function Clone(obj, keepPrototype = false) {
    if (obj == null)
        return obj;
    const result = FromJSON(ToJSON(obj));
    if (keepPrototype == true) {
        Object.setPrototypeOf(result, Object.getPrototypeOf(obj));
    }
    return result;
}
export function IsNaN(obj) { return typeof obj == "number" && obj != obj; }
export function IsNumber(obj, allowNumberObj = false, allowNaN = false) {
    if (!allowNaN && IsNaN(obj))
        return false;
    return typeof obj == "number" || (allowNumberObj && obj instanceof Number);
}
export function ToNumber(stringOrFloatVal, valIfConversionFails = NaN, allowParseNaN = false) {
    if (!IsString(stringOrFloatVal) && !IsNumber(stringOrFloatVal))
        return valIfConversionFails;
    if (IsString(stringOrFloatVal) && stringOrFloatVal.length == 0)
        return valIfConversionFails;
    const result = Number(stringOrFloatVal);
    if (IsNaN(result) && !allowParseNaN)
        return valIfConversionFails;
    return result;
}
export function NumberCES_KeepBetween(s, min, max, allowFixMinMax = true) {
    if (min > max && allowFixMinMax) {
        [min, max] = [max, min];
    }
    if (s < min)
        return min;
    if (s > max)
        return max;
    return s;
}
/*export function Math_Truncate(value: number) {
    if (value >= 0) return Math.floor(value);
    return Math.ceil(value);
}*/
// just use the word 'percent', even though value is represented as fraction (e.g. 0.5, rather than 50[%])
export function Lerp(from, to, percentFromXToY) {
    const result = from + ((to - from) * percentFromXToY);
    //if (keepResultInRange) result = NumberCE(result).KeepBetween(from, to) as number;
    return result;
}
export function GetPercentFromXToY(start, end, val) {
    // distance-from-x / distance-from-x-required-for-result-'1'
    var result = (val - start) / (end - start);
    //if (keepResultInRange) result = NumberCE(result).KeepBetween(0, 1) as number;
    return result;
}
