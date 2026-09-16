var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// ../../node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "../../node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// ../../node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.17.1/node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS({
  "../../node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.17.1/node_modules/ajv-formats/dist/formats.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatNames = exports.fastFormats = exports.fullFormats = void 0;
    function fmtDef(validate, compare) {
      return { validate, compare };
    }
    exports.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: fmtDef(date, compareDate),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: fmtDef(getTime(true), compareTime),
      "date-time": fmtDef(getDateTime(true), compareDateTime),
      "iso-time": fmtDef(getTime(), compareIsoTime),
      "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri,
      "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte,
      // signed 32 bit integer
      int32: { type: "number", validate: validateInt32 },
      // signed 64 bit integer
      int64: { type: "number", validate: validateInt64 },
      // C-type float
      float: { type: "number", validate: validateNumber },
      // C-type double
      double: { type: "number", validate: validateNumber },
      // hint to the UI to hide input strings
      password: true,
      // unchecked string payload
      binary: true
    };
    exports.fastFormats = {
      ...exports.fullFormats,
      date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
      time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
      "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
      "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
      "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
    };
    exports.formatNames = Object.keys(exports.fullFormats);
    function isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
    var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function date(str) {
      const matches = DATE.exec(str);
      if (!matches)
        return false;
      const year = +matches[1];
      const month = +matches[2];
      const day = +matches[3];
      return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
    }
    function compareDate(d1, d2) {
      if (!(d1 && d2))
        return void 0;
      if (d1 > d2)
        return 1;
      if (d1 < d2)
        return -1;
      return 0;
    }
    var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function getTime(strictTimeZone) {
      return function time(str) {
        const matches = TIME.exec(str);
        if (!matches)
          return false;
        const hr = +matches[1];
        const min = +matches[2];
        const sec = +matches[3];
        const tz = matches[4];
        const tzSign = matches[5] === "-" ? -1 : 1;
        const tzH = +(matches[6] || 0);
        const tzM = +(matches[7] || 0);
        if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
          return false;
        if (hr <= 23 && min <= 59 && sec < 60)
          return true;
        const utcMin = min - tzM * tzSign;
        const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
        return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
      };
    }
    function compareTime(s1, s2) {
      if (!(s1 && s2))
        return void 0;
      const t1 = (/* @__PURE__ */ new Date("2020-01-01T" + s1)).valueOf();
      const t2 = (/* @__PURE__ */ new Date("2020-01-01T" + s2)).valueOf();
      if (!(t1 && t2))
        return void 0;
      return t1 - t2;
    }
    function compareIsoTime(t1, t2) {
      if (!(t1 && t2))
        return void 0;
      const a1 = TIME.exec(t1);
      const a2 = TIME.exec(t2);
      if (!(a1 && a2))
        return void 0;
      t1 = a1[1] + a1[2] + a1[3];
      t2 = a2[1] + a2[2] + a2[3];
      if (t1 > t2)
        return 1;
      if (t1 < t2)
        return -1;
      return 0;
    }
    var DATE_TIME_SEPARATOR = /t|\s/i;
    function getDateTime(strictTimeZone) {
      const time = getTime(strictTimeZone);
      return function date_time(str) {
        const dateTime = str.split(DATE_TIME_SEPARATOR);
        return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
      };
    }
    function compareDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const d1 = new Date(dt1).valueOf();
      const d2 = new Date(dt2).valueOf();
      if (!(d1 && d2))
        return void 0;
      return d1 - d2;
    }
    function compareIsoDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
      const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
      const res = compareDate(d1, d2);
      if (res === void 0)
        return void 0;
      return res || compareTime(t1, t2);
    }
    var NOT_URI_FRAGMENT = /\/|:/;
    var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function uri(str) {
      return NOT_URI_FRAGMENT.test(str) && URI.test(str);
    }
    var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function byte(str) {
      BYTE.lastIndex = 0;
      return BYTE.test(str);
    }
    var MIN_INT32 = -(2 ** 31);
    var MAX_INT32 = 2 ** 31 - 1;
    function validateInt32(value) {
      return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
    }
    function validateInt64(value) {
      return Number.isInteger(value);
    }
    function validateNumber() {
      return true;
    }
    var Z_ANCHOR = /[^\\]\\Z/;
    function regex(str) {
      if (Z_ANCHOR.test(str))
        return false;
      try {
        new RegExp(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
});

// <stdin>
var check0 = validate0;
var schema3 = { "enum": ["terms", "prospectus", "other"], "type": "string" };
var func0 = Object.prototype.hasOwnProperty;
var formats0 = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function validate2(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate2.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.category === void 0 || !func0.call(data, "category")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "category" }, message: "must have required property 'category'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.offeringId === void 0 || !func0.call(data, "offeringId")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "offeringId" }, message: "must have required property 'offeringId'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.filename === void 0 || !func0.call(data, "filename")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "filename" }, message: "must have required property 'filename'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.size === void 0 || !func0.call(data, "size")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "size" }, message: "must have required property 'size'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.category !== void 0 && func0.call(data, "category")) {
      let data0 = data.category;
      if (typeof data0 !== "string") {
        const err5 = { instancePath: instancePath + "/category", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema8/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (!(data0 === "terms" || data0 === "prospectus" || data0 === "other")) {
        const err6 = { instancePath: instancePath + "/category", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema8/enum", keyword: "enum", params: { allowedValues: schema3.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.filename !== void 0 && func0.call(data, "filename")) {
      if (typeof data.filename !== "string") {
        const err7 = { instancePath: instancePath + "/filename", schemaPath: "#/properties/filename/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data2 = data.id;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.note !== void 0 && func0.call(data, "note")) {
      if (typeof data.note !== "string") {
        const err10 = { instancePath: instancePath + "/note", schemaPath: "#/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.offeringId !== void 0 && func0.call(data, "offeringId")) {
      let data4 = data.offeringId;
      if (typeof data4 === "string") {
        if (!formats0.test(data4)) {
          const err11 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      } else {
        const err12 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.size !== void 0 && func0.call(data, "size")) {
      let data5 = data.size;
      if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)))) {
        const err13 = { instancePath: instancePath + "/size", schemaPath: "#/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
      if (typeof data5 == "number") {
        if (data5 < 0 || isNaN(data5)) {
          const err14 = { instancePath: instancePath + "/size", schemaPath: "#/properties/size/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate2.errors = vErrors;
  return errors === 0;
}
validate2.evaluated = { "props": { "category": true, "filename": true, "id": true, "note": true, "offeringId": true, "size": true }, "dynamicProps": false, "dynamicItems": false };
function validate0(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate0.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate2(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate2.errors : vErrors.concat(validate2.errors);
    errors = vErrors.length;
  }
  validate0.errors = vErrors;
  return errors === 0;
}
validate0.evaluated = { "props": { "category": true, "filename": true, "id": true, "note": true, "offeringId": true, "size": true }, "dynamicProps": false, "dynamicItems": false };
var check1 = validate4;
function validate4(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate4.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema23/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema23/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema23/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema23/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema23/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema23/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema23/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema23/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema23/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate4.errors = vErrors;
  return errors === 0;
}
validate4.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check2 = validate5;
function validate5(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate5.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema24/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema24/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema24/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema24/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema24/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema24/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema24/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema24/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema24/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate5.errors = vErrors;
  return errors === 0;
}
validate5.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check3 = validate6;
function validate6(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate6.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema25/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema25/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema25/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema25/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema25/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema25/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema25/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema25/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema25/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate6.errors = vErrors;
  return errors === 0;
}
validate6.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check4 = validate7;
function validate7(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate7.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema27/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema27/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema27/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema27/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema27/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema27/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema27/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema27/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema27/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate7.errors = vErrors;
  return errors === 0;
}
validate7.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check5 = validate8;
function validate8(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate8.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema28/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema28/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema28/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema28/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema28/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema28/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema28/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema28/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema28/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate8.errors = vErrors;
  return errors === 0;
}
validate8.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check6 = validate9;
function validate9(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate9.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema29/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema29/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema29/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema29/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema29/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema29/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema29/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema29/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema29/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate9.errors = vErrors;
  return errors === 0;
}
validate9.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check7 = validate10;
function validate10(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate10.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!(typeof data == "number" && (!(data % 1) && !isNaN(data)))) {
    const err0 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  }
  if (typeof data == "number") {
    if (data < 0 || isNaN(data)) {
      const err1 = { instancePath, schemaPath: "#/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
  }
  validate10.errors = vErrors;
  return errors === 0;
}
validate10.evaluated = { "dynamicProps": false, "dynamicItems": false };
var check8 = validate11;
function validate11(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate11.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema33/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema33/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema33/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema33/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema33/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema33/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema33/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema33/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema33/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate11.errors = vErrors;
  return errors === 0;
}
validate11.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check9 = validate12;
function validate12(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate12.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema34/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema34/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema34/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema34/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema34/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema34/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema34/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema34/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema34/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate12.errors = vErrors;
  return errors === 0;
}
validate12.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check10 = validate13;
function validate13(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate13.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema35/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema35/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema35/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema35/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema35/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema35/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema35/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema35/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema35/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate13.errors = vErrors;
  return errors === 0;
}
validate13.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check11 = validate14;
var schema24 = { "properties": { "country": { "maxLength": 2, "minLength": 2, "type": "string" }, "displayName": { "minLength": 2, "type": "string" }, "email": { "format": "email", "type": "string" }, "id": { "format": "uuid", "readOnly": true, "type": "string" }, "kind": { "enum": ["company"], "type": "string" }, "registrationNumber": { "minLength": 3, "type": "string" } }, "required": ["displayName", "email", "country", "kind", "registrationNumber", "id"], "type": "object" };
var func81 = require_ucs2length().default;
var formats4 = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
function validate14(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate14.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.displayName === void 0 || !func0.call(data, "displayName")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/required", keyword: "required", params: { missingProperty: "displayName" }, message: "must have required property 'displayName'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.email === void 0 || !func0.call(data, "email")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/required", keyword: "required", params: { missingProperty: "email" }, message: "must have required property 'email'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.country === void 0 || !func0.call(data, "country")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/required", keyword: "required", params: { missingProperty: "country" }, message: "must have required property 'country'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.kind === void 0 || !func0.call(data, "kind")) {
      const err3 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.registrationNumber === void 0 || !func0.call(data, "registrationNumber")) {
      const err4 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/required", keyword: "required", params: { missingProperty: "registrationNumber" }, message: "must have required property 'registrationNumber'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err5 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.country !== void 0 && func0.call(data, "country")) {
      let data0 = data.country;
      if (typeof data0 === "string") {
        if (func81(data0) > 2) {
          const err6 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/country/maxLength", keyword: "maxLength", params: { limit: 2 }, message: "must NOT have more than 2 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (func81(data0) < 2) {
          const err7 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/country/minLength", keyword: "minLength", params: { limit: 2 }, message: "must NOT have fewer than 2 characters" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/country/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.displayName !== void 0 && func0.call(data, "displayName")) {
      let data1 = data.displayName;
      if (typeof data1 === "string") {
        if (func81(data1) < 2) {
          const err9 = { instancePath: instancePath + "/displayName", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/displayName/minLength", keyword: "minLength", params: { limit: 2 }, message: "must NOT have fewer than 2 characters" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
      } else {
        const err10 = { instancePath: instancePath + "/displayName", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/displayName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.email !== void 0 && func0.call(data, "email")) {
      let data2 = data.email;
      if (typeof data2 === "string") {
        if (!formats4.test(data2)) {
          const err11 = { instancePath: instancePath + "/email", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/email/format", keyword: "format", params: { format: "email" }, message: 'must match format "email"' };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      } else {
        const err12 = { instancePath: instancePath + "/email", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/email/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data3 = data.id;
      if (typeof data3 === "string") {
        if (!formats0.test(data3)) {
          const err13 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      } else {
        const err14 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.kind !== void 0 && func0.call(data, "kind")) {
      let data4 = data.kind;
      if (typeof data4 !== "string") {
        const err15 = { instancePath: instancePath + "/kind", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
      if (!(data4 === "company")) {
        const err16 = { instancePath: instancePath + "/kind", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/kind/enum", keyword: "enum", params: { allowedValues: schema24.properties.kind.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
    if (data.registrationNumber !== void 0 && func0.call(data, "registrationNumber")) {
      let data5 = data.registrationNumber;
      if (typeof data5 === "string") {
        if (func81(data5) < 3) {
          const err17 = { instancePath: instancePath + "/registrationNumber", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/registrationNumber/minLength", keyword: "minLength", params: { limit: 3 }, message: "must NOT have fewer than 3 characters" };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
      } else {
        const err18 = { instancePath: instancePath + "/registrationNumber", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/properties/registrationNumber/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
  } else {
    const err19 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema37/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err19];
    } else {
      vErrors.push(err19);
    }
    errors++;
  }
  validate14.errors = vErrors;
  return errors === 0;
}
validate14.evaluated = { "props": { "country": true, "displayName": true, "email": true, "id": true, "kind": true, "registrationNumber": true }, "dynamicProps": false, "dynamicItems": false };
var check12 = validate15;
function validate15(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate15.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema38/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema38/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema38/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema38/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema38/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema38/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema38/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema38/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema38/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate15.errors = vErrors;
  return errors === 0;
}
validate15.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check13 = validate16;
function validate16(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate16.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema39/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema39/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema39/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema39/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema39/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema39/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema39/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema39/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema39/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate16.errors = vErrors;
  return errors === 0;
}
validate16.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check14 = validate17;
function validate17(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate17.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema40/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema40/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema40/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema40/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema40/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema40/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema40/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema40/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema40/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate17.errors = vErrors;
  return errors === 0;
}
validate17.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check15 = validate18;
var schema32 = { "properties": { "country": { "maxLength": 2, "minLength": 2, "type": "string" }, "displayName": { "minLength": 2, "type": "string" }, "email": { "format": "email", "type": "string" }, "id": { "format": "uuid", "readOnly": true, "type": "string" }, "kind": { "enum": ["individual"], "type": "string" } }, "required": ["displayName", "email", "country", "kind", "id"], "type": "object" };
function validate18(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate18.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.displayName === void 0 || !func0.call(data, "displayName")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/required", keyword: "required", params: { missingProperty: "displayName" }, message: "must have required property 'displayName'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.email === void 0 || !func0.call(data, "email")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/required", keyword: "required", params: { missingProperty: "email" }, message: "must have required property 'email'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.country === void 0 || !func0.call(data, "country")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/required", keyword: "required", params: { missingProperty: "country" }, message: "must have required property 'country'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.kind === void 0 || !func0.call(data, "kind")) {
      const err3 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err4 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.country !== void 0 && func0.call(data, "country")) {
      let data0 = data.country;
      if (typeof data0 === "string") {
        if (func81(data0) > 2) {
          const err5 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/country/maxLength", keyword: "maxLength", params: { limit: 2 }, message: "must NOT have more than 2 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (func81(data0) < 2) {
          const err6 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/country/minLength", keyword: "minLength", params: { limit: 2 }, message: "must NOT have fewer than 2 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/country/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.displayName !== void 0 && func0.call(data, "displayName")) {
      let data1 = data.displayName;
      if (typeof data1 === "string") {
        if (func81(data1) < 2) {
          const err8 = { instancePath: instancePath + "/displayName", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/displayName/minLength", keyword: "minLength", params: { limit: 2 }, message: "must NOT have fewer than 2 characters" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/displayName", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/displayName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.email !== void 0 && func0.call(data, "email")) {
      let data2 = data.email;
      if (typeof data2 === "string") {
        if (!formats4.test(data2)) {
          const err10 = { instancePath: instancePath + "/email", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/email/format", keyword: "format", params: { format: "email" }, message: 'must match format "email"' };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/email", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/email/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data3 = data.id;
      if (typeof data3 === "string") {
        if (!formats0.test(data3)) {
          const err12 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      } else {
        const err13 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.kind !== void 0 && func0.call(data, "kind")) {
      let data4 = data.kind;
      if (typeof data4 !== "string") {
        const err14 = { instancePath: instancePath + "/kind", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
      if (!(data4 === "individual")) {
        const err15 = { instancePath: instancePath + "/kind", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/properties/kind/enum", keyword: "enum", params: { allowedValues: schema32.properties.kind.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
  } else {
    const err16 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema42/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err16];
    } else {
      vErrors.push(err16);
    }
    errors++;
  }
  validate18.errors = vErrors;
  return errors === 0;
}
validate18.evaluated = { "props": { "country": true, "displayName": true, "email": true, "id": true, "kind": true }, "dynamicProps": false, "dynamicItems": false };
var check16 = validate19;
function validate19(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate19.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema43/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema43/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema43/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema43/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema43/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema43/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema43/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema43/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema43/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate19.errors = vErrors;
  return errors === 0;
}
validate19.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check17 = validate20;
function validate20(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate20.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema44/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema44/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema44/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema44/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema44/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema44/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema44/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema44/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema44/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate20.errors = vErrors;
  return errors === 0;
}
validate20.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check18 = validate21;
function validate21(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate21.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema45/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema45/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema45/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema45/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema45/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema45/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema45/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema45/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema45/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate21.errors = vErrors;
  return errors === 0;
}
validate21.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check19 = validate22;
function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate23.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.displayName === void 0 || !func0.call(data, "displayName")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/required", keyword: "required", params: { missingProperty: "displayName" }, message: "must have required property 'displayName'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.email === void 0 || !func0.call(data, "email")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/required", keyword: "required", params: { missingProperty: "email" }, message: "must have required property 'email'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.country === void 0 || !func0.call(data, "country")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/required", keyword: "required", params: { missingProperty: "country" }, message: "must have required property 'country'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.kind === void 0 || !func0.call(data, "kind")) {
      const err3 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err4 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.country !== void 0 && func0.call(data, "country")) {
      let data0 = data.country;
      if (typeof data0 === "string") {
        if (func81(data0) > 2) {
          const err5 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/country/maxLength", keyword: "maxLength", params: { limit: 2 }, message: "must NOT have more than 2 characters" };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (func81(data0) < 2) {
          const err6 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/country/minLength", keyword: "minLength", params: { limit: 2 }, message: "must NOT have fewer than 2 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/country/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.displayName !== void 0 && func0.call(data, "displayName")) {
      let data1 = data.displayName;
      if (typeof data1 === "string") {
        if (func81(data1) < 2) {
          const err8 = { instancePath: instancePath + "/displayName", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/displayName/minLength", keyword: "minLength", params: { limit: 2 }, message: "must NOT have fewer than 2 characters" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/displayName", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/displayName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.email !== void 0 && func0.call(data, "email")) {
      let data2 = data.email;
      if (typeof data2 === "string") {
        if (!formats4.test(data2)) {
          const err10 = { instancePath: instancePath + "/email", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/email/format", keyword: "format", params: { format: "email" }, message: 'must match format "email"' };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/email", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/email/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data3 = data.id;
      if (typeof data3 === "string") {
        if (!formats0.test(data3)) {
          const err12 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      } else {
        const err13 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.kind !== void 0 && func0.call(data, "kind")) {
      let data4 = data.kind;
      if (typeof data4 !== "string") {
        const err14 = { instancePath: instancePath + "/kind", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
      if (!(data4 === "individual")) {
        const err15 = { instancePath: instancePath + "/kind", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/properties/kind/enum", keyword: "enum", params: { allowedValues: schema32.properties.kind.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
  } else {
    const err16 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema10/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err16];
    } else {
      vErrors.push(err16);
    }
    errors++;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = {};
    props0.country = true;
    props0.displayName = true;
    props0.email = true;
    props0.id = true;
    props0.kind = true;
  }
  const _errs14 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.displayName === void 0 || !func0.call(data, "displayName")) {
      const err17 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "displayName" }, message: "must have required property 'displayName'" };
      if (vErrors === null) {
        vErrors = [err17];
      } else {
        vErrors.push(err17);
      }
      errors++;
    }
    if (data.email === void 0 || !func0.call(data, "email")) {
      const err18 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "email" }, message: "must have required property 'email'" };
      if (vErrors === null) {
        vErrors = [err18];
      } else {
        vErrors.push(err18);
      }
      errors++;
    }
    if (data.country === void 0 || !func0.call(data, "country")) {
      const err19 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "country" }, message: "must have required property 'country'" };
      if (vErrors === null) {
        vErrors = [err19];
      } else {
        vErrors.push(err19);
      }
      errors++;
    }
    if (data.kind === void 0 || !func0.call(data, "kind")) {
      const err20 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
      if (vErrors === null) {
        vErrors = [err20];
      } else {
        vErrors.push(err20);
      }
      errors++;
    }
    if (data.registrationNumber === void 0 || !func0.call(data, "registrationNumber")) {
      const err21 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "registrationNumber" }, message: "must have required property 'registrationNumber'" };
      if (vErrors === null) {
        vErrors = [err21];
      } else {
        vErrors.push(err21);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err22 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err22];
      } else {
        vErrors.push(err22);
      }
      errors++;
    }
    if (data.country !== void 0 && func0.call(data, "country")) {
      let data5 = data.country;
      if (typeof data5 === "string") {
        if (func81(data5) > 2) {
          const err23 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/country/maxLength", keyword: "maxLength", params: { limit: 2 }, message: "must NOT have more than 2 characters" };
          if (vErrors === null) {
            vErrors = [err23];
          } else {
            vErrors.push(err23);
          }
          errors++;
        }
        if (func81(data5) < 2) {
          const err24 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/country/minLength", keyword: "minLength", params: { limit: 2 }, message: "must NOT have fewer than 2 characters" };
          if (vErrors === null) {
            vErrors = [err24];
          } else {
            vErrors.push(err24);
          }
          errors++;
        }
      } else {
        const err25 = { instancePath: instancePath + "/country", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/country/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err25];
        } else {
          vErrors.push(err25);
        }
        errors++;
      }
    }
    if (data.displayName !== void 0 && func0.call(data, "displayName")) {
      let data6 = data.displayName;
      if (typeof data6 === "string") {
        if (func81(data6) < 2) {
          const err26 = { instancePath: instancePath + "/displayName", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/displayName/minLength", keyword: "minLength", params: { limit: 2 }, message: "must NOT have fewer than 2 characters" };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        }
      } else {
        const err27 = { instancePath: instancePath + "/displayName", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/displayName/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
    }
    if (data.email !== void 0 && func0.call(data, "email")) {
      let data7 = data.email;
      if (typeof data7 === "string") {
        if (!formats4.test(data7)) {
          const err28 = { instancePath: instancePath + "/email", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/email/format", keyword: "format", params: { format: "email" }, message: 'must match format "email"' };
          if (vErrors === null) {
            vErrors = [err28];
          } else {
            vErrors.push(err28);
          }
          errors++;
        }
      } else {
        const err29 = { instancePath: instancePath + "/email", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/email/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err29];
        } else {
          vErrors.push(err29);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data8 = data.id;
      if (typeof data8 === "string") {
        if (!formats0.test(data8)) {
          const err30 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err30];
          } else {
            vErrors.push(err30);
          }
          errors++;
        }
      } else {
        const err31 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err31];
        } else {
          vErrors.push(err31);
        }
        errors++;
      }
    }
    if (data.kind !== void 0 && func0.call(data, "kind")) {
      let data9 = data.kind;
      if (typeof data9 !== "string") {
        const err32 = { instancePath: instancePath + "/kind", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err32];
        } else {
          vErrors.push(err32);
        }
        errors++;
      }
      if (!(data9 === "company")) {
        const err33 = { instancePath: instancePath + "/kind", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/kind/enum", keyword: "enum", params: { allowedValues: schema24.properties.kind.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err33];
        } else {
          vErrors.push(err33);
        }
        errors++;
      }
    }
    if (data.registrationNumber !== void 0 && func0.call(data, "registrationNumber")) {
      let data10 = data.registrationNumber;
      if (typeof data10 === "string") {
        if (func81(data10) < 3) {
          const err34 = { instancePath: instancePath + "/registrationNumber", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/registrationNumber/minLength", keyword: "minLength", params: { limit: 3 }, message: "must NOT have fewer than 3 characters" };
          if (vErrors === null) {
            vErrors = [err34];
          } else {
            vErrors.push(err34);
          }
          errors++;
        }
      } else {
        const err35 = { instancePath: instancePath + "/registrationNumber", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/properties/registrationNumber/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err35];
        } else {
          vErrors.push(err35);
        }
        errors++;
      }
    }
  } else {
    const err36 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err36];
    } else {
      vErrors.push(err36);
    }
    errors++;
  }
  var _valid0 = _errs14 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = props0 || {};
        props0.country = true;
        props0.displayName = true;
        props0.email = true;
        props0.id = true;
        props0.kind = true;
        props0.registrationNumber = true;
      }
    }
  }
  if (!valid0) {
    const err37 = { instancePath, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err37];
    } else {
      vErrors.push(err37);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate23.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate23.evaluated = { "dynamicProps": true, "dynamicItems": false };
function validate22(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate22.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate23(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
    errors = vErrors.length;
  } else {
    var props0 = validate23.evaluated.props;
  }
  validate22.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate22.evaluated = { "dynamicProps": true, "dynamicItems": false };
var check20 = validate25;
function validate25(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate25.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema48/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema48/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema48/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema48/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema48/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema48/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema48/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema48/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema48/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate25.errors = vErrors;
  return errors === 0;
}
validate25.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check21 = validate26;
function validate26(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate26.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema49/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema49/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema49/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema49/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema49/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema49/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema49/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema49/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema49/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate26.errors = vErrors;
  return errors === 0;
}
validate26.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check22 = validate27;
function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate27.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema50/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema50/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema50/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema50/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema50/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema50/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema50/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema50/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema50/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate27.errors = vErrors;
  return errors === 0;
}
validate27.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check23 = validate28;
var schema50 = { "properties": { "id": { "format": "uuid", "type": "string" }, "result": { "$ref": "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema17" }, "state": { "enum": ["completed"], "type": "string" } }, "required": ["id", "state", "result"], "type": "object" };
var schema51 = { "properties": { "amount": { "pattern": "^[0-9]+\\.[0-9]{2}$", "type": "string" }, "id": { "format": "uuid", "readOnly": true, "type": "string" }, "investorId": { "format": "uuid", "type": "string" }, "metadata": { "additionalProperties": { "type": "string" }, "type": "object" }, "offeringId": { "format": "uuid", "readOnly": true, "type": "string" }, "status": { "$ref": "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema18" }, "submittedAt": { "format": "date-time", "readOnly": true, "type": ["string", "null"] } }, "required": ["investorId", "amount", "id", "offeringId", "status", "submittedAt"], "type": "object" };
var schema52 = { "enum": ["draft", "submitted"], "type": "string" };
var pattern0 = new RegExp("^[0-9]+\\.[0-9]{2}$", "u");
var formats28 = require_formats().fullFormats["date-time"];
function validate30(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate30.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.investorId === void 0 || !func0.call(data, "investorId")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "investorId" }, message: "must have required property 'investorId'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.amount === void 0 || !func0.call(data, "amount")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "amount" }, message: "must have required property 'amount'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.offeringId === void 0 || !func0.call(data, "offeringId")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "offeringId" }, message: "must have required property 'offeringId'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.submittedAt === void 0 || !func0.call(data, "submittedAt")) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "submittedAt" }, message: "must have required property 'submittedAt'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.amount !== void 0 && func0.call(data, "amount")) {
      let data0 = data.amount;
      if (typeof data0 === "string") {
        if (!pattern0.test(data0)) {
          const err6 = { instancePath: instancePath + "/amount", schemaPath: "#/properties/amount/pattern", keyword: "pattern", params: { pattern: "^[0-9]+\\.[0-9]{2}$" }, message: 'must match pattern "^[0-9]+\\.[0-9]{2}$"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/amount", schemaPath: "#/properties/amount/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data1 = data.id;
      if (typeof data1 === "string") {
        if (!formats0.test(data1)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.investorId !== void 0 && func0.call(data, "investorId")) {
      let data2 = data.investorId;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err10 = { instancePath: instancePath + "/investorId", schemaPath: "#/properties/investorId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/investorId", schemaPath: "#/properties/investorId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.metadata !== void 0 && func0.call(data, "metadata")) {
      let data3 = data.metadata;
      if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
        for (const key0 of Object.keys(data3)) {
          if (typeof data3[key0] !== "string") {
            const err12 = { instancePath: instancePath + "/metadata/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/metadata/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      } else {
        const err13 = { instancePath: instancePath + "/metadata", schemaPath: "#/properties/metadata/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.offeringId !== void 0 && func0.call(data, "offeringId")) {
      let data5 = data.offeringId;
      if (typeof data5 === "string") {
        if (!formats0.test(data5)) {
          const err14 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      } else {
        const err15 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data6 = data.status;
      if (typeof data6 !== "string") {
        const err16 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema18/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
      if (!(data6 === "draft" || data6 === "submitted")) {
        const err17 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema18/enum", keyword: "enum", params: { allowedValues: schema52.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.submittedAt !== void 0 && func0.call(data, "submittedAt")) {
      let data7 = data.submittedAt;
      if (typeof data7 !== "string" && data7 !== null) {
        const err18 = { instancePath: instancePath + "/submittedAt", schemaPath: "#/properties/submittedAt/type", keyword: "type", params: { type: schema51.properties.submittedAt.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
      if (typeof data7 === "string") {
        if (!formats28.validate(data7)) {
          const err19 = { instancePath: instancePath + "/submittedAt", schemaPath: "#/properties/submittedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
      }
    }
  } else {
    const err20 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err20];
    } else {
      vErrors.push(err20);
    }
    errors++;
  }
  validate30.errors = vErrors;
  return errors === 0;
}
validate30.evaluated = { "props": { "amount": true, "id": true, "investorId": true, "metadata": true, "offeringId": true, "status": true, "submittedAt": true }, "dynamicProps": false, "dynamicItems": false };
function validate29(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate29.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.state === void 0 || !func0.call(data, "state")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.result === void 0 || !func0.call(data, "result")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "result" }, message: "must have required property 'result'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data0 = data.id;
      if (typeof data0 === "string") {
        if (!formats0.test(data0)) {
          const err3 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.result !== void 0 && func0.call(data, "result")) {
      if (!validate30(data.result, { instancePath: instancePath + "/result", parentData: data, parentDataProperty: "result", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
        errors = vErrors.length;
      }
    }
    if (data.state !== void 0 && func0.call(data, "state")) {
      let data2 = data.state;
      if (typeof data2 !== "string") {
        const err5 = { instancePath: instancePath + "/state", schemaPath: "#/properties/state/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (!(data2 === "completed")) {
        const err6 = { instancePath: instancePath + "/state", schemaPath: "#/properties/state/enum", keyword: "enum", params: { allowedValues: schema50.properties.state.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
  } else {
    const err7 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err7];
    } else {
      vErrors.push(err7);
    }
    errors++;
  }
  validate29.errors = vErrors;
  return errors === 0;
}
validate29.evaluated = { "props": { "id": true, "result": true, "state": true }, "dynamicProps": false, "dynamicItems": false };
function validate28(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate28.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate29(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
    errors = vErrors.length;
  }
  validate28.errors = vErrors;
  return errors === 0;
}
validate28.evaluated = { "props": { "id": true, "result": true, "state": true }, "dynamicProps": false, "dynamicItems": false };
var check24 = validate33;
function validate33(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate33.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema53/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema53/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema53/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema53/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema53/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema53/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema53/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema53/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema53/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate33.errors = vErrors;
  return errors === 0;
}
validate33.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check25 = validate34;
function validate34(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate34.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema54/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema54/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema54/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema54/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema54/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema54/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema54/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema54/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema54/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate34.errors = vErrors;
  return errors === 0;
}
validate34.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check26 = validate35;
function validate35(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate35.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema55/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema55/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema55/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema55/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema55/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema55/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema55/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema55/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema55/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate35.errors = vErrors;
  return errors === 0;
}
validate35.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check27 = validate36;
var schema62 = { "properties": { "createdAt": { "format": "date-time", "readOnly": true, "type": "string" }, "description": { "type": ["string", "null"] }, "id": { "format": "uuid", "readOnly": true, "type": "string" }, "name": { "minLength": 3, "type": "string" }, "status": { "$ref": "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema12" }, "tags": { "items": { "type": "string" }, "type": "array" }, "terms": { "$ref": "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema5" } }, "required": ["name", "terms", "id", "status", "createdAt"], "type": "object" };
var schema63 = { "enum": ["draft", "open", "closed"], "type": "string" };
var schema65 = { "enum": ["EUR", "USD"], "type": "string" };
function validate39(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate39.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.minimumInvestment === void 0 || !func0.call(data, "minimumInvestment")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "minimumInvestment" }, message: "must have required property 'minimumInvestment'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.currency === void 0 || !func0.call(data, "currency")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "currency" }, message: "must have required property 'currency'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.closesAt === void 0 || !func0.call(data, "closesAt")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "closesAt" }, message: "must have required property 'closesAt'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.closesAt !== void 0 && func0.call(data, "closesAt")) {
      let data0 = data.closesAt;
      if (typeof data0 === "string") {
        if (!formats28.validate(data0)) {
          const err3 = { instancePath: instancePath + "/closesAt", schemaPath: "#/properties/closesAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/closesAt", schemaPath: "#/properties/closesAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.currency !== void 0 && func0.call(data, "currency")) {
      let data1 = data.currency;
      if (typeof data1 !== "string") {
        const err5 = { instancePath: instancePath + "/currency", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema6/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (!(data1 === "EUR" || data1 === "USD")) {
        const err6 = { instancePath: instancePath + "/currency", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema6/enum", keyword: "enum", params: { allowedValues: schema65.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.minimumInvestment !== void 0 && func0.call(data, "minimumInvestment")) {
      let data2 = data.minimumInvestment;
      if (typeof data2 === "string") {
        if (!pattern0.test(data2)) {
          const err7 = { instancePath: instancePath + "/minimumInvestment", schemaPath: "#/properties/minimumInvestment/pattern", keyword: "pattern", params: { pattern: "^[0-9]+\\.[0-9]{2}$" }, message: 'must match pattern "^[0-9]+\\.[0-9]{2}$"' };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
      } else {
        const err8 = { instancePath: instancePath + "/minimumInvestment", schemaPath: "#/properties/minimumInvestment/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate39.errors = vErrors;
  return errors === 0;
}
validate39.evaluated = { "props": { "closesAt": true, "currency": true, "minimumInvestment": true }, "dynamicProps": false, "dynamicItems": false };
function validate38(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate38.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.name === void 0 || !func0.call(data, "name")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.terms === void 0 || !func0.call(data, "terms")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "terms" }, message: "must have required property 'terms'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.createdAt === void 0 || !func0.call(data, "createdAt")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.createdAt !== void 0 && func0.call(data, "createdAt")) {
      let data0 = data.createdAt;
      if (typeof data0 === "string") {
        if (!formats28.validate(data0)) {
          const err5 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.description !== void 0 && func0.call(data, "description")) {
      let data1 = data.description;
      if (typeof data1 !== "string" && data1 !== null) {
        const err7 = { instancePath: instancePath + "/description", schemaPath: "#/properties/description/type", keyword: "type", params: { type: schema62.properties.description.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data2 = data.id;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.name !== void 0 && func0.call(data, "name")) {
      let data3 = data.name;
      if (typeof data3 === "string") {
        if (func81(data3) < 3) {
          const err10 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 3 }, message: "must NOT have fewer than 3 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data4 = data.status;
      if (typeof data4 !== "string") {
        const err12 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema12/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
      if (!(data4 === "draft" || data4 === "open" || data4 === "closed")) {
        const err13 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema12/enum", keyword: "enum", params: { allowedValues: schema63.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.tags !== void 0 && func0.call(data, "tags")) {
      let data5 = data.tags;
      if (Array.isArray(data5)) {
        const len0 = data5.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data5[i0] !== "string") {
            const err14 = { instancePath: instancePath + "/tags/" + i0, schemaPath: "#/properties/tags/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
      } else {
        const err15 = { instancePath: instancePath + "/tags", schemaPath: "#/properties/tags/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.terms !== void 0 && func0.call(data, "terms")) {
      if (!validate39(data.terms, { instancePath: instancePath + "/terms", parentData: data, parentDataProperty: "terms", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err16 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err16];
    } else {
      vErrors.push(err16);
    }
    errors++;
  }
  validate38.errors = vErrors;
  return errors === 0;
}
validate38.evaluated = { "props": { "createdAt": true, "description": true, "id": true, "name": true, "status": true, "tags": true, "terms": true }, "dynamicProps": false, "dynamicItems": false };
function validate37(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate37.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.page === void 0 || !func0.call(data, "page")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/required", keyword: "required", params: { missingProperty: "page" }, message: "must have required property 'page'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.limit === void 0 || !func0.call(data, "limit")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/required", keyword: "required", params: { missingProperty: "limit" }, message: "must have required property 'limit'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.total === void 0 || !func0.call(data, "total")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/required", keyword: "required", params: { missingProperty: "total" }, message: "must have required property 'total'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.limit !== void 0 && func0.call(data, "limit")) {
      let data0 = data.limit;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err3 = { instancePath: instancePath + "/limit", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 < 1 || isNaN(data0)) {
          const err4 = { instancePath: instancePath + "/limit", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      }
    }
    if (data.page !== void 0 && func0.call(data, "page")) {
      let data1 = data.page;
      if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)))) {
        const err5 = { instancePath: instancePath + "/page", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/page/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (typeof data1 == "number") {
        if (data1 < 1 || isNaN(data1)) {
          const err6 = { instancePath: instancePath + "/page", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/page/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      }
    }
    if (data.total !== void 0 && func0.call(data, "total")) {
      let data2 = data.total;
      if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
        const err7 = { instancePath: instancePath + "/total", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/total/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
      if (typeof data2 == "number") {
        if (data2 < 0 || isNaN(data2)) {
          const err8 = { instancePath: instancePath + "/total", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/total/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.items === void 0 || !func0.call(data, "items")) {
      const err10 = { instancePath, schemaPath: "#/allOf/1/required", keyword: "required", params: { missingProperty: "items" }, message: "must have required property 'items'" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    if (data.items !== void 0 && func0.call(data, "items")) {
      let data3 = data.items;
      if (Array.isArray(data3)) {
        const len0 = data3.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (!validate38(data3[i0], { instancePath: instancePath + "/items/" + i0, parentData: data3, parentDataProperty: i0, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate38.errors : vErrors.concat(validate38.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err11 = { instancePath: instancePath + "/items", schemaPath: "#/allOf/1/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
  } else {
    const err12 = { instancePath, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err12];
    } else {
      vErrors.push(err12);
    }
    errors++;
  }
  validate37.errors = vErrors;
  return errors === 0;
}
validate37.evaluated = { "props": { "items": true, "limit": true, "page": true, "total": true }, "dynamicProps": false, "dynamicItems": false };
function validate36(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate36.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate37(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
    errors = vErrors.length;
  }
  validate36.errors = vErrors;
  return errors === 0;
}
validate36.evaluated = { "props": { "items": true, "limit": true, "page": true, "total": true }, "dynamicProps": false, "dynamicItems": false };
var check28 = validate43;
function validate43(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate43.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema60/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema60/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema60/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema60/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema60/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema60/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema60/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema60/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema60/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate43.errors = vErrors;
  return errors === 0;
}
validate43.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check29 = validate44;
function validate44(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate44.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema61/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema61/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema61/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema61/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema61/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema61/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema61/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema61/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema61/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate44.errors = vErrors;
  return errors === 0;
}
validate44.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check30 = validate45;
function validate45(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate45.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema62/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema62/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema62/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema62/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema62/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema62/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema62/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema62/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema62/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate45.errors = vErrors;
  return errors === 0;
}
validate45.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check31 = validate46;
function validate47(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate47.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.name === void 0 || !func0.call(data, "name")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.terms === void 0 || !func0.call(data, "terms")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "terms" }, message: "must have required property 'terms'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.createdAt === void 0 || !func0.call(data, "createdAt")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.createdAt !== void 0 && func0.call(data, "createdAt")) {
      let data0 = data.createdAt;
      if (typeof data0 === "string") {
        if (!formats28.validate(data0)) {
          const err5 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.description !== void 0 && func0.call(data, "description")) {
      let data1 = data.description;
      if (typeof data1 !== "string" && data1 !== null) {
        const err7 = { instancePath: instancePath + "/description", schemaPath: "#/properties/description/type", keyword: "type", params: { type: schema62.properties.description.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data2 = data.id;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.name !== void 0 && func0.call(data, "name")) {
      let data3 = data.name;
      if (typeof data3 === "string") {
        if (func81(data3) < 3) {
          const err10 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 3 }, message: "must NOT have fewer than 3 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data4 = data.status;
      if (typeof data4 !== "string") {
        const err12 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema12/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
      if (!(data4 === "draft" || data4 === "open" || data4 === "closed")) {
        const err13 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema12/enum", keyword: "enum", params: { allowedValues: schema63.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.tags !== void 0 && func0.call(data, "tags")) {
      let data5 = data.tags;
      if (Array.isArray(data5)) {
        const len0 = data5.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data5[i0] !== "string") {
            const err14 = { instancePath: instancePath + "/tags/" + i0, schemaPath: "#/properties/tags/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
      } else {
        const err15 = { instancePath: instancePath + "/tags", schemaPath: "#/properties/tags/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.terms !== void 0 && func0.call(data, "terms")) {
      if (!validate39(data.terms, { instancePath: instancePath + "/terms", parentData: data, parentDataProperty: "terms", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err16 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err16];
    } else {
      vErrors.push(err16);
    }
    errors++;
  }
  validate47.errors = vErrors;
  return errors === 0;
}
validate47.evaluated = { "props": { "createdAt": true, "description": true, "id": true, "name": true, "status": true, "tags": true, "terms": true }, "dynamicProps": false, "dynamicItems": false };
function validate46(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate46.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate47(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate47.errors : vErrors.concat(validate47.errors);
    errors = vErrors.length;
  }
  validate46.errors = vErrors;
  return errors === 0;
}
validate46.evaluated = { "props": { "createdAt": true, "description": true, "id": true, "name": true, "status": true, "tags": true, "terms": true }, "dynamicProps": false, "dynamicItems": false };
var check32 = validate50;
function validate50(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate50.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema65/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema65/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema65/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema65/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema65/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema65/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema65/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema65/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema65/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate50.errors = vErrors;
  return errors === 0;
}
validate50.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check33 = validate51;
function validate51(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate51.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema66/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema66/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema66/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema66/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema66/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema66/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema66/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema66/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema66/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate51.errors = vErrors;
  return errors === 0;
}
validate51.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check34 = validate52;
function validate52(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate52.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema67/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema67/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema67/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema67/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema67/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema67/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema67/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema67/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema67/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate52.errors = vErrors;
  return errors === 0;
}
validate52.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check35 = validate53;
function validate54(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate54.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.name === void 0 || !func0.call(data, "name")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.terms === void 0 || !func0.call(data, "terms")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "terms" }, message: "must have required property 'terms'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.createdAt === void 0 || !func0.call(data, "createdAt")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.createdAt !== void 0 && func0.call(data, "createdAt")) {
      let data0 = data.createdAt;
      if (typeof data0 === "string") {
        if (!formats28.validate(data0)) {
          const err5 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.description !== void 0 && func0.call(data, "description")) {
      let data1 = data.description;
      if (typeof data1 !== "string" && data1 !== null) {
        const err7 = { instancePath: instancePath + "/description", schemaPath: "#/properties/description/type", keyword: "type", params: { type: schema62.properties.description.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data2 = data.id;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.name !== void 0 && func0.call(data, "name")) {
      let data3 = data.name;
      if (typeof data3 === "string") {
        if (func81(data3) < 3) {
          const err10 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 3 }, message: "must NOT have fewer than 3 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data4 = data.status;
      if (typeof data4 !== "string") {
        const err12 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema12/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
      if (!(data4 === "draft" || data4 === "open" || data4 === "closed")) {
        const err13 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema12/enum", keyword: "enum", params: { allowedValues: schema63.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.tags !== void 0 && func0.call(data, "tags")) {
      let data5 = data.tags;
      if (Array.isArray(data5)) {
        const len0 = data5.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data5[i0] !== "string") {
            const err14 = { instancePath: instancePath + "/tags/" + i0, schemaPath: "#/properties/tags/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
      } else {
        const err15 = { instancePath: instancePath + "/tags", schemaPath: "#/properties/tags/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.terms !== void 0 && func0.call(data, "terms")) {
      if (!validate39(data.terms, { instancePath: instancePath + "/terms", parentData: data, parentDataProperty: "terms", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err16 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err16];
    } else {
      vErrors.push(err16);
    }
    errors++;
  }
  validate54.errors = vErrors;
  return errors === 0;
}
validate54.evaluated = { "props": { "createdAt": true, "description": true, "id": true, "name": true, "status": true, "tags": true, "terms": true }, "dynamicProps": false, "dynamicItems": false };
function validate53(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate53.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate54(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate54.errors : vErrors.concat(validate54.errors);
    errors = vErrors.length;
  }
  validate53.errors = vErrors;
  return errors === 0;
}
validate53.evaluated = { "props": { "createdAt": true, "description": true, "id": true, "name": true, "status": true, "tags": true, "terms": true }, "dynamicProps": false, "dynamicItems": false };
var check36 = validate57;
function validate57(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate57.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema70/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema70/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema70/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema70/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema70/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema70/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema70/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema70/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema70/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate57.errors = vErrors;
  return errors === 0;
}
validate57.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check37 = validate58;
function validate58(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate58.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema71/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema71/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema71/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema71/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema71/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema71/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema71/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema71/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema71/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate58.errors = vErrors;
  return errors === 0;
}
validate58.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check38 = validate59;
function validate59(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate59.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema72/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema72/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema72/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema72/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema72/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema72/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema72/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema72/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema72/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate59.errors = vErrors;
  return errors === 0;
}
validate59.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check39 = validate60;
function validate61(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate61.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.name === void 0 || !func0.call(data, "name")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.terms === void 0 || !func0.call(data, "terms")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "terms" }, message: "must have required property 'terms'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.createdAt === void 0 || !func0.call(data, "createdAt")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.createdAt !== void 0 && func0.call(data, "createdAt")) {
      let data0 = data.createdAt;
      if (typeof data0 === "string") {
        if (!formats28.validate(data0)) {
          const err5 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/createdAt", schemaPath: "#/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.description !== void 0 && func0.call(data, "description")) {
      let data1 = data.description;
      if (typeof data1 !== "string" && data1 !== null) {
        const err7 = { instancePath: instancePath + "/description", schemaPath: "#/properties/description/type", keyword: "type", params: { type: schema62.properties.description.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data2 = data.id;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.name !== void 0 && func0.call(data, "name")) {
      let data3 = data.name;
      if (typeof data3 === "string") {
        if (func81(data3) < 3) {
          const err10 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 3 }, message: "must NOT have fewer than 3 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data4 = data.status;
      if (typeof data4 !== "string") {
        const err12 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema12/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
      if (!(data4 === "draft" || data4 === "open" || data4 === "closed")) {
        const err13 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema12/enum", keyword: "enum", params: { allowedValues: schema63.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.tags !== void 0 && func0.call(data, "tags")) {
      let data5 = data.tags;
      if (Array.isArray(data5)) {
        const len0 = data5.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data5[i0] !== "string") {
            const err14 = { instancePath: instancePath + "/tags/" + i0, schemaPath: "#/properties/tags/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
      } else {
        const err15 = { instancePath: instancePath + "/tags", schemaPath: "#/properties/tags/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.terms !== void 0 && func0.call(data, "terms")) {
      if (!validate39(data.terms, { instancePath: instancePath + "/terms", parentData: data, parentDataProperty: "terms", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err16 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err16];
    } else {
      vErrors.push(err16);
    }
    errors++;
  }
  validate61.errors = vErrors;
  return errors === 0;
}
validate61.evaluated = { "props": { "createdAt": true, "description": true, "id": true, "name": true, "status": true, "tags": true, "terms": true }, "dynamicProps": false, "dynamicItems": false };
function validate60(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate60.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate61(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate61.errors : vErrors.concat(validate61.errors);
    errors = vErrors.length;
  }
  validate60.errors = vErrors;
  return errors === 0;
}
validate60.evaluated = { "props": { "createdAt": true, "description": true, "id": true, "name": true, "status": true, "tags": true, "terms": true }, "dynamicProps": false, "dynamicItems": false };
var check40 = validate64;
function validate64(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate64.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema76/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema76/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema76/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema76/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema76/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema76/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema76/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema76/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema76/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate64.errors = vErrors;
  return errors === 0;
}
validate64.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check41 = validate65;
function validate65(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate65.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema77/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema77/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema77/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema77/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema77/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema77/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema77/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema77/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema77/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate65.errors = vErrors;
  return errors === 0;
}
validate65.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check42 = validate66;
function validate66(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate66.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema78/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema78/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema78/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema78/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema78/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema78/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema78/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema78/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema78/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate66.errors = vErrors;
  return errors === 0;
}
validate66.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check43 = validate67;
function validate67(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate67.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema80/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema80/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema80/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema80/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema80/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema80/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema80/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema80/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema80/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate67.errors = vErrors;
  return errors === 0;
}
validate67.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check44 = validate68;
function validate68(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate68.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema81/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema81/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema81/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema81/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema81/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema81/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema81/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema81/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema81/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate68.errors = vErrors;
  return errors === 0;
}
validate68.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check45 = validate69;
function validate69(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate69.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema82/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema82/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema82/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema82/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema82/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema82/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema82/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema82/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema82/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate69.errors = vErrors;
  return errors === 0;
}
validate69.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check46 = validate70;
function validate70(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate70.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema83/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema83/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema83/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema83/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema83/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema83/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema83/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema83/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema83/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate70.errors = vErrors;
  return errors === 0;
}
validate70.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check47 = validate71;
function validate72(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate72.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.category === void 0 || !func0.call(data, "category")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "category" }, message: "must have required property 'category'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.offeringId === void 0 || !func0.call(data, "offeringId")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "offeringId" }, message: "must have required property 'offeringId'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.filename === void 0 || !func0.call(data, "filename")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "filename" }, message: "must have required property 'filename'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.size === void 0 || !func0.call(data, "size")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "size" }, message: "must have required property 'size'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.category !== void 0 && func0.call(data, "category")) {
      let data0 = data.category;
      if (typeof data0 !== "string") {
        const err5 = { instancePath: instancePath + "/category", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema8/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (!(data0 === "terms" || data0 === "prospectus" || data0 === "other")) {
        const err6 = { instancePath: instancePath + "/category", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema8/enum", keyword: "enum", params: { allowedValues: schema3.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.filename !== void 0 && func0.call(data, "filename")) {
      if (typeof data.filename !== "string") {
        const err7 = { instancePath: instancePath + "/filename", schemaPath: "#/properties/filename/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data2 = data.id;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.note !== void 0 && func0.call(data, "note")) {
      if (typeof data.note !== "string") {
        const err10 = { instancePath: instancePath + "/note", schemaPath: "#/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.offeringId !== void 0 && func0.call(data, "offeringId")) {
      let data4 = data.offeringId;
      if (typeof data4 === "string") {
        if (!formats0.test(data4)) {
          const err11 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      } else {
        const err12 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.size !== void 0 && func0.call(data, "size")) {
      let data5 = data.size;
      if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)))) {
        const err13 = { instancePath: instancePath + "/size", schemaPath: "#/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
      if (typeof data5 == "number") {
        if (data5 < 0 || isNaN(data5)) {
          const err14 = { instancePath: instancePath + "/size", schemaPath: "#/properties/size/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate72.errors = vErrors;
  return errors === 0;
}
validate72.evaluated = { "props": { "category": true, "filename": true, "id": true, "note": true, "offeringId": true, "size": true }, "dynamicProps": false, "dynamicItems": false };
function validate71(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate71.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate72(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate72.errors : vErrors.concat(validate72.errors);
    errors = vErrors.length;
  }
  validate71.errors = vErrors;
  return errors === 0;
}
validate71.evaluated = { "props": { "category": true, "filename": true, "id": true, "note": true, "offeringId": true, "size": true }, "dynamicProps": false, "dynamicItems": false };
var check48 = validate74;
function validate74(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate74.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema87/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema87/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema87/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema87/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema87/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema87/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema87/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema87/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema87/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate74.errors = vErrors;
  return errors === 0;
}
validate74.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check49 = validate75;
function validate75(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate75.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema88/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema88/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema88/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema88/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema88/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema88/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema88/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema88/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema88/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate75.errors = vErrors;
  return errors === 0;
}
validate75.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check50 = validate76;
function validate76(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate76.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema89/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema89/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema89/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema89/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema89/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema89/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema89/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema89/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema89/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate76.errors = vErrors;
  return errors === 0;
}
validate76.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check51 = validate77;
function validate77(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate77.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema90/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema90/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema90/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema90/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema90/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema90/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema90/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema90/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema90/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate77.errors = vErrors;
  return errors === 0;
}
validate77.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check52 = validate78;
function validate79(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate79.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.offeringId === void 0 || !func0.call(data, "offeringId")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "offeringId" }, message: "must have required property 'offeringId'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.subscriptionCount === void 0 || !func0.call(data, "subscriptionCount")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "subscriptionCount" }, message: "must have required property 'subscriptionCount'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.currency === void 0 || !func0.call(data, "currency")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "currency" }, message: "must have required property 'currency'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.currency !== void 0 && func0.call(data, "currency")) {
      let data0 = data.currency;
      if (typeof data0 !== "string") {
        const err3 = { instancePath: instancePath + "/currency", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema6/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if (!(data0 === "EUR" || data0 === "USD")) {
        const err4 = { instancePath: instancePath + "/currency", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema6/enum", keyword: "enum", params: { allowedValues: schema65.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.offeringId !== void 0 && func0.call(data, "offeringId")) {
      let data1 = data.offeringId;
      if (typeof data1 === "string") {
        if (!formats0.test(data1)) {
          const err5 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.subscriptionCount !== void 0 && func0.call(data, "subscriptionCount")) {
      let data2 = data.subscriptionCount;
      if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
        const err7 = { instancePath: instancePath + "/subscriptionCount", schemaPath: "#/properties/subscriptionCount/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
      if (typeof data2 == "number") {
        if (data2 < 0 || isNaN(data2)) {
          const err8 = { instancePath: instancePath + "/subscriptionCount", schemaPath: "#/properties/subscriptionCount/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate79.errors = vErrors;
  return errors === 0;
}
validate79.evaluated = { "props": { "currency": true, "offeringId": true, "subscriptionCount": true }, "dynamicProps": false, "dynamicItems": false };
function validate78(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate78.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate79(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate79.errors : vErrors.concat(validate79.errors);
    errors = vErrors.length;
  }
  validate78.errors = vErrors;
  return errors === 0;
}
validate78.evaluated = { "props": { "currency": true, "offeringId": true, "subscriptionCount": true }, "dynamicProps": false, "dynamicItems": false };
var check53 = validate81;
function validate81(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate81.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (typeof data !== "string") {
    const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema93/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  }
  validate81.errors = vErrors;
  return errors === 0;
}
validate81.evaluated = { "dynamicProps": false, "dynamicItems": false };
var check54 = validate82;
function validate82(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate82.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema94/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema94/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema94/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema94/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema94/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema94/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema94/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema94/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema94/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate82.errors = vErrors;
  return errors === 0;
}
validate82.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check55 = validate83;
function validate83(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate83.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema95/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema95/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema95/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema95/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema95/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema95/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema95/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema95/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema95/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate83.errors = vErrors;
  return errors === 0;
}
validate83.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check56 = validate84;
function validate84(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate84.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema96/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema96/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema96/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema96/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema96/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema96/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema96/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema96/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema96/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate84.errors = vErrors;
  return errors === 0;
}
validate84.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check57 = validate85;
function validate86(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate86.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.page === void 0 || !func0.call(data, "page")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/required", keyword: "required", params: { missingProperty: "page" }, message: "must have required property 'page'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.limit === void 0 || !func0.call(data, "limit")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/required", keyword: "required", params: { missingProperty: "limit" }, message: "must have required property 'limit'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.total === void 0 || !func0.call(data, "total")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/required", keyword: "required", params: { missingProperty: "total" }, message: "must have required property 'total'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.limit !== void 0 && func0.call(data, "limit")) {
      let data0 = data.limit;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err3 = { instancePath: instancePath + "/limit", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 < 1 || isNaN(data0)) {
          const err4 = { instancePath: instancePath + "/limit", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      }
    }
    if (data.page !== void 0 && func0.call(data, "page")) {
      let data1 = data.page;
      if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)))) {
        const err5 = { instancePath: instancePath + "/page", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/page/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
      if (typeof data1 == "number") {
        if (data1 < 1 || isNaN(data1)) {
          const err6 = { instancePath: instancePath + "/page", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/page/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      }
    }
    if (data.total !== void 0 && func0.call(data, "total")) {
      let data2 = data.total;
      if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
        const err7 = { instancePath: instancePath + "/total", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/total/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
      if (typeof data2 == "number") {
        if (data2 < 0 || isNaN(data2)) {
          const err8 = { instancePath: instancePath + "/total", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/properties/total/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema14/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.items === void 0 || !func0.call(data, "items")) {
      const err10 = { instancePath, schemaPath: "#/allOf/1/required", keyword: "required", params: { missingProperty: "items" }, message: "must have required property 'items'" };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    if (data.items !== void 0 && func0.call(data, "items")) {
      let data3 = data.items;
      if (Array.isArray(data3)) {
        const len0 = data3.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (!validate30(data3[i0], { instancePath: instancePath + "/items/" + i0, parentData: data3, parentDataProperty: i0, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err11 = { instancePath: instancePath + "/items", schemaPath: "#/allOf/1/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
  } else {
    const err12 = { instancePath, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err12];
    } else {
      vErrors.push(err12);
    }
    errors++;
  }
  validate86.errors = vErrors;
  return errors === 0;
}
validate86.evaluated = { "props": { "items": true, "limit": true, "page": true, "total": true }, "dynamicProps": false, "dynamicItems": false };
function validate85(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate85.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate86(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate86.errors : vErrors.concat(validate86.errors);
    errors = vErrors.length;
  }
  validate85.errors = vErrors;
  return errors === 0;
}
validate85.evaluated = { "props": { "items": true, "limit": true, "page": true, "total": true }, "dynamicProps": false, "dynamicItems": false };
var check58 = validate89;
function validate89(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate89.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema102/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema102/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema102/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema102/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema102/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema102/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema102/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema102/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema102/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate89.errors = vErrors;
  return errors === 0;
}
validate89.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check59 = validate90;
function validate90(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate90.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema103/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema103/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema103/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema103/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema103/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema103/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema103/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema103/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema103/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate90.errors = vErrors;
  return errors === 0;
}
validate90.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check60 = validate91;
function validate91(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate91.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema104/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema104/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema104/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema104/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema104/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema104/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema104/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema104/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema104/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate91.errors = vErrors;
  return errors === 0;
}
validate91.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check61 = validate92;
function validate93(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate93.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.investorId === void 0 || !func0.call(data, "investorId")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "investorId" }, message: "must have required property 'investorId'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.amount === void 0 || !func0.call(data, "amount")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "amount" }, message: "must have required property 'amount'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.offeringId === void 0 || !func0.call(data, "offeringId")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "offeringId" }, message: "must have required property 'offeringId'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.submittedAt === void 0 || !func0.call(data, "submittedAt")) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "submittedAt" }, message: "must have required property 'submittedAt'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.amount !== void 0 && func0.call(data, "amount")) {
      let data0 = data.amount;
      if (typeof data0 === "string") {
        if (!pattern0.test(data0)) {
          const err6 = { instancePath: instancePath + "/amount", schemaPath: "#/properties/amount/pattern", keyword: "pattern", params: { pattern: "^[0-9]+\\.[0-9]{2}$" }, message: 'must match pattern "^[0-9]+\\.[0-9]{2}$"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/amount", schemaPath: "#/properties/amount/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data1 = data.id;
      if (typeof data1 === "string") {
        if (!formats0.test(data1)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.investorId !== void 0 && func0.call(data, "investorId")) {
      let data2 = data.investorId;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err10 = { instancePath: instancePath + "/investorId", schemaPath: "#/properties/investorId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/investorId", schemaPath: "#/properties/investorId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.metadata !== void 0 && func0.call(data, "metadata")) {
      let data3 = data.metadata;
      if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
        for (const key0 of Object.keys(data3)) {
          if (typeof data3[key0] !== "string") {
            const err12 = { instancePath: instancePath + "/metadata/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/metadata/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      } else {
        const err13 = { instancePath: instancePath + "/metadata", schemaPath: "#/properties/metadata/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.offeringId !== void 0 && func0.call(data, "offeringId")) {
      let data5 = data.offeringId;
      if (typeof data5 === "string") {
        if (!formats0.test(data5)) {
          const err14 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      } else {
        const err15 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data6 = data.status;
      if (typeof data6 !== "string") {
        const err16 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema18/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
      if (!(data6 === "draft" || data6 === "submitted")) {
        const err17 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema18/enum", keyword: "enum", params: { allowedValues: schema52.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.submittedAt !== void 0 && func0.call(data, "submittedAt")) {
      let data7 = data.submittedAt;
      if (typeof data7 !== "string" && data7 !== null) {
        const err18 = { instancePath: instancePath + "/submittedAt", schemaPath: "#/properties/submittedAt/type", keyword: "type", params: { type: schema51.properties.submittedAt.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
      if (typeof data7 === "string") {
        if (!formats28.validate(data7)) {
          const err19 = { instancePath: instancePath + "/submittedAt", schemaPath: "#/properties/submittedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
      }
    }
  } else {
    const err20 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err20];
    } else {
      vErrors.push(err20);
    }
    errors++;
  }
  validate93.errors = vErrors;
  return errors === 0;
}
validate93.evaluated = { "props": { "amount": true, "id": true, "investorId": true, "metadata": true, "offeringId": true, "status": true, "submittedAt": true }, "dynamicProps": false, "dynamicItems": false };
function validate92(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate92.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate93(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
    errors = vErrors.length;
  }
  validate92.errors = vErrors;
  return errors === 0;
}
validate92.evaluated = { "props": { "amount": true, "id": true, "investorId": true, "metadata": true, "offeringId": true, "status": true, "submittedAt": true }, "dynamicProps": false, "dynamicItems": false };
var check62 = validate95;
function validate95(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate95.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema108/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema108/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema108/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema108/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema108/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema108/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema108/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema108/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema108/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate95.errors = vErrors;
  return errors === 0;
}
validate95.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check63 = validate96;
function validate96(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate96.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema109/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema109/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema109/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema109/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema109/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema109/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema109/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema109/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema109/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate96.errors = vErrors;
  return errors === 0;
}
validate96.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check64 = validate97;
function validate97(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate97.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema110/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema110/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema110/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema110/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema110/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema110/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema110/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema110/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema110/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate97.errors = vErrors;
  return errors === 0;
}
validate97.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check65 = validate98;
function validate99(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate99.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.investorId === void 0 || !func0.call(data, "investorId")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "investorId" }, message: "must have required property 'investorId'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.amount === void 0 || !func0.call(data, "amount")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "amount" }, message: "must have required property 'amount'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.offeringId === void 0 || !func0.call(data, "offeringId")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "offeringId" }, message: "must have required property 'offeringId'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.submittedAt === void 0 || !func0.call(data, "submittedAt")) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "submittedAt" }, message: "must have required property 'submittedAt'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.amount !== void 0 && func0.call(data, "amount")) {
      let data0 = data.amount;
      if (typeof data0 === "string") {
        if (!pattern0.test(data0)) {
          const err6 = { instancePath: instancePath + "/amount", schemaPath: "#/properties/amount/pattern", keyword: "pattern", params: { pattern: "^[0-9]+\\.[0-9]{2}$" }, message: 'must match pattern "^[0-9]+\\.[0-9]{2}$"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/amount", schemaPath: "#/properties/amount/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data1 = data.id;
      if (typeof data1 === "string") {
        if (!formats0.test(data1)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.investorId !== void 0 && func0.call(data, "investorId")) {
      let data2 = data.investorId;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err10 = { instancePath: instancePath + "/investorId", schemaPath: "#/properties/investorId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/investorId", schemaPath: "#/properties/investorId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.metadata !== void 0 && func0.call(data, "metadata")) {
      let data3 = data.metadata;
      if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
        for (const key0 of Object.keys(data3)) {
          if (typeof data3[key0] !== "string") {
            const err12 = { instancePath: instancePath + "/metadata/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/metadata/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      } else {
        const err13 = { instancePath: instancePath + "/metadata", schemaPath: "#/properties/metadata/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.offeringId !== void 0 && func0.call(data, "offeringId")) {
      let data5 = data.offeringId;
      if (typeof data5 === "string") {
        if (!formats0.test(data5)) {
          const err14 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      } else {
        const err15 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data6 = data.status;
      if (typeof data6 !== "string") {
        const err16 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema18/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
      if (!(data6 === "draft" || data6 === "submitted")) {
        const err17 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema18/enum", keyword: "enum", params: { allowedValues: schema52.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.submittedAt !== void 0 && func0.call(data, "submittedAt")) {
      let data7 = data.submittedAt;
      if (typeof data7 !== "string" && data7 !== null) {
        const err18 = { instancePath: instancePath + "/submittedAt", schemaPath: "#/properties/submittedAt/type", keyword: "type", params: { type: schema51.properties.submittedAt.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
      if (typeof data7 === "string") {
        if (!formats28.validate(data7)) {
          const err19 = { instancePath: instancePath + "/submittedAt", schemaPath: "#/properties/submittedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
      }
    }
  } else {
    const err20 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err20];
    } else {
      vErrors.push(err20);
    }
    errors++;
  }
  validate99.errors = vErrors;
  return errors === 0;
}
validate99.evaluated = { "props": { "amount": true, "id": true, "investorId": true, "metadata": true, "offeringId": true, "status": true, "submittedAt": true }, "dynamicProps": false, "dynamicItems": false };
function validate98(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate98.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate99(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
    errors = vErrors.length;
  }
  validate98.errors = vErrors;
  return errors === 0;
}
validate98.evaluated = { "props": { "amount": true, "id": true, "investorId": true, "metadata": true, "offeringId": true, "status": true, "submittedAt": true }, "dynamicProps": false, "dynamicItems": false };
var check66 = validate101;
function validate101(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate101.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema113/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema113/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema113/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema113/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema113/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema113/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema113/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema113/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema113/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate101.errors = vErrors;
  return errors === 0;
}
validate101.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check67 = validate102;
function validate102(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate102.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema114/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema114/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema114/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema114/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema114/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema114/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema114/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema114/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema114/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate102.errors = vErrors;
  return errors === 0;
}
validate102.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check68 = validate103;
function validate103(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate103.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema115/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema115/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema115/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema115/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema115/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema115/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema115/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema115/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema115/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate103.errors = vErrors;
  return errors === 0;
}
validate103.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check69 = validate104;
function validate105(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate105.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.investorId === void 0 || !func0.call(data, "investorId")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "investorId" }, message: "must have required property 'investorId'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.amount === void 0 || !func0.call(data, "amount")) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "amount" }, message: "must have required property 'amount'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.offeringId === void 0 || !func0.call(data, "offeringId")) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "offeringId" }, message: "must have required property 'offeringId'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.submittedAt === void 0 || !func0.call(data, "submittedAt")) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "submittedAt" }, message: "must have required property 'submittedAt'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.amount !== void 0 && func0.call(data, "amount")) {
      let data0 = data.amount;
      if (typeof data0 === "string") {
        if (!pattern0.test(data0)) {
          const err6 = { instancePath: instancePath + "/amount", schemaPath: "#/properties/amount/pattern", keyword: "pattern", params: { pattern: "^[0-9]+\\.[0-9]{2}$" }, message: 'must match pattern "^[0-9]+\\.[0-9]{2}$"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/amount", schemaPath: "#/properties/amount/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      let data1 = data.id;
      if (typeof data1 === "string") {
        if (!formats0.test(data1)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.investorId !== void 0 && func0.call(data, "investorId")) {
      let data2 = data.investorId;
      if (typeof data2 === "string") {
        if (!formats0.test(data2)) {
          const err10 = { instancePath: instancePath + "/investorId", schemaPath: "#/properties/investorId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/investorId", schemaPath: "#/properties/investorId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.metadata !== void 0 && func0.call(data, "metadata")) {
      let data3 = data.metadata;
      if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
        for (const key0 of Object.keys(data3)) {
          if (typeof data3[key0] !== "string") {
            const err12 = { instancePath: instancePath + "/metadata/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/metadata/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      } else {
        const err13 = { instancePath: instancePath + "/metadata", schemaPath: "#/properties/metadata/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.offeringId !== void 0 && func0.call(data, "offeringId")) {
      let data5 = data.offeringId;
      if (typeof data5 === "string") {
        if (!formats0.test(data5)) {
          const err14 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      } else {
        const err15 = { instancePath: instancePath + "/offeringId", schemaPath: "#/properties/offeringId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data6 = data.status;
      if (typeof data6 !== "string") {
        const err16 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema18/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
      if (!(data6 === "draft" || data6 === "submitted")) {
        const err17 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema18/enum", keyword: "enum", params: { allowedValues: schema52.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.submittedAt !== void 0 && func0.call(data, "submittedAt")) {
      let data7 = data.submittedAt;
      if (typeof data7 !== "string" && data7 !== null) {
        const err18 = { instancePath: instancePath + "/submittedAt", schemaPath: "#/properties/submittedAt/type", keyword: "type", params: { type: schema51.properties.submittedAt.type }, message: "must be string,null" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
      if (typeof data7 === "string") {
        if (!formats28.validate(data7)) {
          const err19 = { instancePath: instancePath + "/submittedAt", schemaPath: "#/properties/submittedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
      }
    }
  } else {
    const err20 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err20];
    } else {
      vErrors.push(err20);
    }
    errors++;
  }
  validate105.errors = vErrors;
  return errors === 0;
}
validate105.evaluated = { "props": { "amount": true, "id": true, "investorId": true, "metadata": true, "offeringId": true, "status": true, "submittedAt": true }, "dynamicProps": false, "dynamicItems": false };
function validate104(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate104.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (!validate105(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate105.errors : vErrors.concat(validate105.errors);
    errors = vErrors.length;
  }
  validate104.errors = vErrors;
  return errors === 0;
}
validate104.evaluated = { "props": { "amount": true, "id": true, "investorId": true, "metadata": true, "offeringId": true, "status": true, "submittedAt": true }, "dynamicProps": false, "dynamicItems": false };
var check70 = validate107;
var schema160 = { "properties": { "jobId": { "format": "uuid", "type": "string" }, "state": { "enum": ["accepted"], "type": "string" } }, "required": ["state", "jobId"], "type": "object" };
function validate107(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate107.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.state === void 0 || !func0.call(data, "state")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema120/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.jobId === void 0 || !func0.call(data, "jobId")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema120/required", keyword: "required", params: { missingProperty: "jobId" }, message: "must have required property 'jobId'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.jobId !== void 0 && func0.call(data, "jobId")) {
      let data0 = data.jobId;
      if (typeof data0 === "string") {
        if (!formats0.test(data0)) {
          const err2 = { instancePath: instancePath + "/jobId", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema120/properties/jobId/format", keyword: "format", params: { format: "uuid" }, message: 'must match format "uuid"' };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
      } else {
        const err3 = { instancePath: instancePath + "/jobId", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema120/properties/jobId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.state !== void 0 && func0.call(data, "state")) {
      let data1 = data.state;
      if (typeof data1 !== "string") {
        const err4 = { instancePath: instancePath + "/state", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema120/properties/state/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
      if (!(data1 === "accepted")) {
        const err5 = { instancePath: instancePath + "/state", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema120/properties/state/enum", keyword: "enum", params: { allowedValues: schema160.properties.state.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema120/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate107.errors = vErrors;
  return errors === 0;
}
validate107.evaluated = { "props": { "jobId": true, "state": true }, "dynamicProps": false, "dynamicItems": false };
var check71 = validate108;
function validate108(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate108.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema121/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema121/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema121/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema121/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema121/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema121/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema121/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema121/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema121/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate108.errors = vErrors;
  return errors === 0;
}
validate108.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check72 = validate109;
function validate109(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate109.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema122/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema122/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema122/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema122/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema122/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema122/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema122/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema122/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema122/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate109.errors = vErrors;
  return errors === 0;
}
validate109.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
var check73 = validate110;
function validate110(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate110.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0 || !func0.call(data, "statusCode")) {
      const err0 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema123/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err1 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema123/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err2 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema123/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema123/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.details !== void 0 && func0.call(data, "details")) {
      let data1 = data.details;
      if (Array.isArray(data1)) {
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data1[i0] !== "string") {
            const err4 = { instancePath: instancePath + "/details/" + i0, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema123/properties/details/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/details", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema123/properties/details/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err6 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema123/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.statusCode !== void 0 && func0.call(data, "statusCode")) {
      let data4 = data.statusCode;
      if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)))) {
        const err7 = { instancePath: instancePath + "/statusCode", schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema123/properties/statusCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = { instancePath, schemaPath: "urn:accord:e3cd8f89f5083235:base:resource0#/$defs/schema123/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  validate110.errors = vErrors;
  return errors === 0;
}
validate110.evaluated = { "props": { "code": true, "details": true, "message": true, "statusCode": true }, "dynamicProps": false, "dynamicItems": false };
export {
  check0,
  check1,
  check10,
  check11,
  check12,
  check13,
  check14,
  check15,
  check16,
  check17,
  check18,
  check19,
  check2,
  check20,
  check21,
  check22,
  check23,
  check24,
  check25,
  check26,
  check27,
  check28,
  check29,
  check3,
  check30,
  check31,
  check32,
  check33,
  check34,
  check35,
  check36,
  check37,
  check38,
  check39,
  check4,
  check40,
  check41,
  check42,
  check43,
  check44,
  check45,
  check46,
  check47,
  check48,
  check49,
  check5,
  check50,
  check51,
  check52,
  check53,
  check54,
  check55,
  check56,
  check57,
  check58,
  check59,
  check6,
  check60,
  check61,
  check62,
  check63,
  check64,
  check65,
  check66,
  check67,
  check68,
  check69,
  check7,
  check70,
  check71,
  check72,
  check73,
  check8,
  check9
};
