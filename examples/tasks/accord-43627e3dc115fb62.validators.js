var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/.pnpm/ajv@8.17.1/node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
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

// node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.17.1/node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS({
  "node_modules/.pnpm/ajv-formats@3.0.1_ajv@8.17.1/node_modules/ajv-formats/dist/formats.js"(exports) {
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
var schema3 = { "additionalProperties": false, "properties": { "createdAt": { "format": "date-time", "readOnly": true, "type": "string" }, "id": { "readOnly": true, "type": "string" }, "labels": { "additionalProperties": { "type": "string" }, "type": "object" }, "status": { "enum": ["open", "done"], "type": "string" }, "title": { "maxLength": 200, "minLength": 1, "type": "string" } }, "required": ["id", "title", "status", "createdAt"], "type": "object" };
var func0 = Object.prototype.hasOwnProperty;
var func11 = require_ucs2length().default;
var formats0 = require_formats().fullFormats["date-time"];
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
    if (data.items === void 0 || !func0.call(data, "items")) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "items" }, message: "must have required property 'items'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 of Object.keys(data)) {
      if (!(key0 === "items" || key0 === "nextCursor")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.items !== void 0 && func0.call(data, "items")) {
      let data0 = data.items;
      if (Array.isArray(data0)) {
        const len0 = data0.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data1 = data0[i0];
          if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
            if (data1.id === void 0 || !func0.call(data1, "id")) {
              const err2 = { instancePath: instancePath + "/items/" + i0, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
            if (data1.title === void 0 || !func0.call(data1, "title")) {
              const err3 = { instancePath: instancePath + "/items/" + i0, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            }
            if (data1.status === void 0 || !func0.call(data1, "status")) {
              const err4 = { instancePath: instancePath + "/items/" + i0, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if (data1.createdAt === void 0 || !func0.call(data1, "createdAt")) {
              const err5 = { instancePath: instancePath + "/items/" + i0, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            for (const key1 of Object.keys(data1)) {
              if (!(key1 === "createdAt" || key1 === "id" || key1 === "labels" || key1 === "status" || key1 === "title")) {
                const err6 = { instancePath: instancePath + "/items/" + i0, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
            }
            if (data1.createdAt !== void 0 && func0.call(data1, "createdAt")) {
              let data2 = data1.createdAt;
              if (typeof data2 === "string") {
                if (!formats0.validate(data2)) {
                  const err7 = { instancePath: instancePath + "/items/" + i0 + "/createdAt", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
                  if (vErrors === null) {
                    vErrors = [err7];
                  } else {
                    vErrors.push(err7);
                  }
                  errors++;
                }
              } else {
                const err8 = { instancePath: instancePath + "/items/" + i0 + "/createdAt", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
            }
            if (data1.id !== void 0 && func0.call(data1, "id")) {
              if (typeof data1.id !== "string") {
                const err9 = { instancePath: instancePath + "/items/" + i0 + "/id", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
            }
            if (data1.labels !== void 0 && func0.call(data1, "labels")) {
              let data4 = data1.labels;
              if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                for (const key2 of Object.keys(data4)) {
                  if (typeof data4[key2] !== "string") {
                    const err10 = { instancePath: instancePath + "/items/" + i0 + "/labels/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/labels/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                    if (vErrors === null) {
                      vErrors = [err10];
                    } else {
                      vErrors.push(err10);
                    }
                    errors++;
                  }
                }
              } else {
                const err11 = { instancePath: instancePath + "/items/" + i0 + "/labels", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/labels/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                if (vErrors === null) {
                  vErrors = [err11];
                } else {
                  vErrors.push(err11);
                }
                errors++;
              }
            }
            if (data1.status !== void 0 && func0.call(data1, "status")) {
              let data6 = data1.status;
              if (typeof data6 !== "string") {
                const err12 = { instancePath: instancePath + "/items/" + i0 + "/status", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/status/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
              if (!(data6 === "open" || data6 === "done")) {
                const err13 = { instancePath: instancePath + "/items/" + i0 + "/status", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/status/enum", keyword: "enum", params: { allowedValues: schema3.properties.status.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              }
            }
            if (data1.title !== void 0 && func0.call(data1, "title")) {
              let data7 = data1.title;
              if (typeof data7 === "string") {
                if (func11(data7) > 200) {
                  const err14 = { instancePath: instancePath + "/items/" + i0 + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/title/maxLength", keyword: "maxLength", params: { limit: 200 }, message: "must NOT have more than 200 characters" };
                  if (vErrors === null) {
                    vErrors = [err14];
                  } else {
                    vErrors.push(err14);
                  }
                  errors++;
                }
                if (func11(data7) < 1) {
                  const err15 = { instancePath: instancePath + "/items/" + i0 + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/title/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err15];
                  } else {
                    vErrors.push(err15);
                  }
                  errors++;
                }
              } else {
                const err16 = { instancePath: instancePath + "/items/" + i0 + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
            }
          } else {
            const err17 = { instancePath: instancePath + "/items/" + i0, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        }
      } else {
        const err18 = { instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
    if (data.nextCursor !== void 0 && func0.call(data, "nextCursor")) {
      if (typeof data.nextCursor !== "string") {
        const err19 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err19];
        } else {
          vErrors.push(err19);
        }
        errors++;
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
  validate2.errors = vErrors;
  return errors === 0;
}
validate2.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
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
validate0.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
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
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err0 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.title === void 0 || !func0.call(data, "title")) {
      const err1 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err2 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.createdAt === void 0 || !func0.call(data, "createdAt")) {
      const err3 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 of Object.keys(data)) {
      if (!(key0 === "createdAt" || key0 === "id" || key0 === "labels" || key0 === "status" || key0 === "title")) {
        const err4 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.createdAt !== void 0 && func0.call(data, "createdAt")) {
      let data0 = data.createdAt;
      if (typeof data0 === "string") {
        if (!formats0.validate(data0)) {
          const err5 = { instancePath: instancePath + "/createdAt", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/createdAt", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      if (typeof data.id !== "string") {
        const err7 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.labels !== void 0 && func0.call(data, "labels")) {
      let data2 = data.labels;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        for (const key1 of Object.keys(data2)) {
          if (typeof data2[key1] !== "string") {
            const err8 = { instancePath: instancePath + "/labels/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/labels/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        }
      } else {
        const err9 = { instancePath: instancePath + "/labels", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/labels/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data4 = data.status;
      if (typeof data4 !== "string") {
        const err10 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/status/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
      if (!(data4 === "open" || data4 === "done")) {
        const err11 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/status/enum", keyword: "enum", params: { allowedValues: schema3.properties.status.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.title !== void 0 && func0.call(data, "title")) {
      let data5 = data.title;
      if (typeof data5 === "string") {
        if (func11(data5) > 200) {
          const err12 = { instancePath: instancePath + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/title/maxLength", keyword: "maxLength", params: { limit: 200 }, message: "must NOT have more than 200 characters" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (func11(data5) < 1) {
          const err13 = { instancePath: instancePath + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/title/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      } else {
        const err14 = { instancePath: instancePath + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema6/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate4.errors = vErrors;
  return errors === 0;
}
validate4.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
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
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err0 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err1 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 of Object.keys(data)) {
      if (!(key0 === "code" || key0 === "message")) {
        const err2 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err4 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
  } else {
    const err5 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  validate5.errors = vErrors;
  return errors === 0;
}
validate5.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
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
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err0 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.title === void 0 || !func0.call(data, "title")) {
      const err1 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err2 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.createdAt === void 0 || !func0.call(data, "createdAt")) {
      const err3 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 of Object.keys(data)) {
      if (!(key0 === "createdAt" || key0 === "id" || key0 === "labels" || key0 === "status" || key0 === "title")) {
        const err4 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.createdAt !== void 0 && func0.call(data, "createdAt")) {
      let data0 = data.createdAt;
      if (typeof data0 === "string") {
        if (!formats0.validate(data0)) {
          const err5 = { instancePath: instancePath + "/createdAt", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/createdAt", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      if (typeof data.id !== "string") {
        const err7 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.labels !== void 0 && func0.call(data, "labels")) {
      let data2 = data.labels;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        for (const key1 of Object.keys(data2)) {
          if (typeof data2[key1] !== "string") {
            const err8 = { instancePath: instancePath + "/labels/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/labels/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        }
      } else {
        const err9 = { instancePath: instancePath + "/labels", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/labels/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data4 = data.status;
      if (typeof data4 !== "string") {
        const err10 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/status/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
      if (!(data4 === "open" || data4 === "done")) {
        const err11 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/status/enum", keyword: "enum", params: { allowedValues: schema3.properties.status.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.title !== void 0 && func0.call(data, "title")) {
      let data5 = data.title;
      if (typeof data5 === "string") {
        if (func11(data5) > 200) {
          const err12 = { instancePath: instancePath + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/title/maxLength", keyword: "maxLength", params: { limit: 200 }, message: "must NOT have more than 200 characters" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (func11(data5) < 1) {
          const err13 = { instancePath: instancePath + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/title/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      } else {
        const err14 = { instancePath: instancePath + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema9/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate6.errors = vErrors;
  return errors === 0;
}
validate6.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
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
    if (data.code === void 0 || !func0.call(data, "code")) {
      const err0 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/required", keyword: "required", params: { missingProperty: "code" }, message: "must have required property 'code'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err1 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 of Object.keys(data)) {
      if (!(key0 === "code" || key0 === "message")) {
        const err2 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.code !== void 0 && func0.call(data, "code")) {
      if (typeof data.code !== "string") {
        const err3 = { instancePath: instancePath + "/code", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err4 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
  } else {
    const err5 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema7/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  validate7.errors = vErrors;
  return errors === 0;
}
validate7.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
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
    if (data.id === void 0 || !func0.call(data, "id")) {
      const err0 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.title === void 0 || !func0.call(data, "title")) {
      const err1 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.status === void 0 || !func0.call(data, "status")) {
      const err2 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/required", keyword: "required", params: { missingProperty: "status" }, message: "must have required property 'status'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.createdAt === void 0 || !func0.call(data, "createdAt")) {
      const err3 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/required", keyword: "required", params: { missingProperty: "createdAt" }, message: "must have required property 'createdAt'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 of Object.keys(data)) {
      if (!(key0 === "createdAt" || key0 === "id" || key0 === "labels" || key0 === "status" || key0 === "title")) {
        const err4 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.createdAt !== void 0 && func0.call(data, "createdAt")) {
      let data0 = data.createdAt;
      if (typeof data0 === "string") {
        if (!formats0.validate(data0)) {
          const err5 = { instancePath: instancePath + "/createdAt", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/createdAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "date-time"' };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
      } else {
        const err6 = { instancePath: instancePath + "/createdAt", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/createdAt/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.id !== void 0 && func0.call(data, "id")) {
      if (typeof data.id !== "string") {
        const err7 = { instancePath: instancePath + "/id", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.labels !== void 0 && func0.call(data, "labels")) {
      let data2 = data.labels;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        for (const key1 of Object.keys(data2)) {
          if (typeof data2[key1] !== "string") {
            const err8 = { instancePath: instancePath + "/labels/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/labels/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        }
      } else {
        const err9 = { instancePath: instancePath + "/labels", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/labels/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.status !== void 0 && func0.call(data, "status")) {
      let data4 = data.status;
      if (typeof data4 !== "string") {
        const err10 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/status/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
      if (!(data4 === "open" || data4 === "done")) {
        const err11 = { instancePath: instancePath + "/status", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/status/enum", keyword: "enum", params: { allowedValues: schema3.properties.status.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.title !== void 0 && func0.call(data, "title")) {
      let data5 = data.title;
      if (typeof data5 === "string") {
        if (func11(data5) > 200) {
          const err12 = { instancePath: instancePath + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/title/maxLength", keyword: "maxLength", params: { limit: 200 }, message: "must NOT have more than 200 characters" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (func11(data5) < 1) {
          const err13 = { instancePath: instancePath + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/title/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
      } else {
        const err14 = { instancePath: instancePath + "/title", schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "urn:accord:43627e3dc115fb62:base:resource0#/$defs/schema11/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate8.errors = vErrors;
  return errors === 0;
}
validate8.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
export {
  check0,
  check1,
  check2,
  check3,
  check4,
  check5
};
