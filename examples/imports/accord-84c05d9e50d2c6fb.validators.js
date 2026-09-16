// <stdin>
var check0 = validate0;
var func0 = Object.prototype.hasOwnProperty;
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
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.state === void 0 || !func0.call(data, "state")) {
      const err0 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema4/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.imported === void 0 || !func0.call(data, "imported")) {
      const err1 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema4/required", keyword: "required", params: { missingProperty: "imported" }, message: "must have required property 'imported'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 of Object.keys(data)) {
      if (!(key0 === "imported" || key0 === "state")) {
        const err2 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema4/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.imported !== void 0 && func0.call(data, "imported")) {
      let data0 = data.imported;
      if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)))) {
        const err3 = { instancePath: instancePath + "/imported", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema4/properties/imported/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      if (typeof data0 == "number") {
        if (data0 < 0 || isNaN(data0)) {
          const err4 = { instancePath: instancePath + "/imported", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema4/properties/imported/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
      }
    }
    if (data.state !== void 0 && func0.call(data, "state")) {
      if ("completed" !== data.state) {
        const err5 = { instancePath: instancePath + "/state", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema4/properties/state/const", keyword: "const", params: { allowedValue: "completed" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
  } else {
    const err6 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema4/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  }
  validate0.errors = vErrors;
  return errors === 0;
}
validate0.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var check1 = validate2;
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
    if (data.state === void 0 || !func0.call(data, "state")) {
      const err0 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema6/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.jobId === void 0 || !func0.call(data, "jobId")) {
      const err1 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema6/required", keyword: "required", params: { missingProperty: "jobId" }, message: "must have required property 'jobId'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 of Object.keys(data)) {
      if (!(key0 === "jobId" || key0 === "state")) {
        const err2 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema6/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.jobId !== void 0 && func0.call(data, "jobId")) {
      if (typeof data.jobId !== "string") {
        const err3 = { instancePath: instancePath + "/jobId", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema6/properties/jobId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.state !== void 0 && func0.call(data, "state")) {
      if ("queued" !== data.state) {
        const err4 = { instancePath: instancePath + "/state", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema6/properties/state/const", keyword: "const", params: { allowedValue: "queued" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
  } else {
    const err5 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema6/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  validate2.errors = vErrors;
  return errors === 0;
}
validate2.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var check2 = validate3;
function validate3(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate3.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.message === void 0 || !func0.call(data, "message")) {
      const err0 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema7/required", keyword: "required", params: { missingProperty: "message" }, message: "must have required property 'message'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.message !== void 0 && func0.call(data, "message")) {
      if (typeof data.message !== "string") {
        const err1 = { instancePath: instancePath + "/message", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema7/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
  } else {
    const err2 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema7/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err2];
    } else {
      vErrors.push(err2);
    }
    errors++;
  }
  validate3.errors = vErrors;
  return errors === 0;
}
validate3.evaluated = { "props": { "message": true }, "dynamicProps": false, "dynamicItems": false };
var check3 = validate4;
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
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.state === void 0 || !func0.call(data, "state")) {
      const err0 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema0/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.jobId === void 0 || !func0.call(data, "jobId")) {
      const err1 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema0/required", keyword: "required", params: { missingProperty: "jobId" }, message: "must have required property 'jobId'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 of Object.keys(data)) {
      if (!(key0 === "jobId" || key0 === "state")) {
        const err2 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema0/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.jobId !== void 0 && func0.call(data, "jobId")) {
      if (typeof data.jobId !== "string") {
        const err3 = { instancePath: instancePath + "/jobId", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema0/properties/jobId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.state !== void 0 && func0.call(data, "state")) {
      if ("queued" !== data.state) {
        const err4 = { instancePath: instancePath + "/state", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema0/properties/state/const", keyword: "const", params: { allowedValue: "queued" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
  } else {
    const err5 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = true;
  }
  const _errs8 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.state === void 0 || !func0.call(data, "state")) {
      const err6 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "state" }, message: "must have required property 'state'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.imported === void 0 || !func0.call(data, "imported")) {
      const err7 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema1/required", keyword: "required", params: { missingProperty: "imported" }, message: "must have required property 'imported'" };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    for (const key1 of Object.keys(data)) {
      if (!(key1 === "imported" || key1 === "state")) {
        const err8 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema1/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.imported !== void 0 && func0.call(data, "imported")) {
      let data2 = data.imported;
      if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
        const err9 = { instancePath: instancePath + "/imported", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema1/properties/imported/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
      if (typeof data2 == "number") {
        if (data2 < 0 || isNaN(data2)) {
          const err10 = { instancePath: instancePath + "/imported", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema1/properties/imported/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      }
    }
    if (data.state !== void 0 && func0.call(data, "state")) {
      if ("completed" !== data.state) {
        const err11 = { instancePath: instancePath + "/state", schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema1/properties/state/const", keyword: "const", params: { allowedValue: "completed" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
  } else {
    const err12 = { instancePath, schemaPath: "urn:accord:84c05d9e50d2c6fb:base:resource0#/$defs/schema1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err12];
    } else {
      vErrors.push(err12);
    }
    errors++;
  }
  var _valid0 = _errs8 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = true;
      }
    }
  }
  if (!valid0) {
    const err13 = { instancePath, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err13];
    } else {
      vErrors.push(err13);
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
  validate5.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate5.evaluated = { "dynamicProps": true, "dynamicItems": false };
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
  if (!validate5(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate5.errors : vErrors.concat(validate5.errors);
    errors = vErrors.length;
  } else {
    var props0 = validate5.evaluated.props;
  }
  validate4.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate4.evaluated = { "dynamicProps": true, "dynamicItems": false };
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
  validate7.errors = vErrors;
  return errors === 0;
}
validate7.evaluated = { "dynamicProps": false, "dynamicItems": false };
export {
  check0,
  check1,
  check2,
  check3,
  check4
};
