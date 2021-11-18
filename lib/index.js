const { readFileSync, existsSync, mkdirSync, writeFileSync } = require("fs");
const path = require("path");
const glob = require("glob");
const rimraf = require("rimraf");
const lodash = require("lodash");
const nunjucks = require("nunjucks");
const prettier = require("prettier");
const SwaggerParser = require("@apidevtools/swagger-parser");
const OpenAPISampler = require("openapi-sampler");

const defaultConfig = {
  // import service方法，默认axios
  importRequest: "import request from 'axios';",
  // import hook方法，默认ahooks useRequest。仅isHook为true时生效。
  importUseRequest: "import {useRequest} from 'ahooks';",
  // 全局request配置，参考axios配置项。
  globalRequestConfig: { headers: { "Content-Type": "application/json" } },
  // 全局hook配置，默认手动。改为自动时参数传递方式：多个参数{defaultParams: [data, config]}，单个参数{defaultParams: data}
  globalHookConfig: { manual: true },
  // OpenAPI Specification描述文件路径，支持json、yaml格式。支持本地文件引用、内部schema引用、外部链接引用。
  oasFilePath: "./openapi/openapi.json",
  // 生成的service文件夹
  serviceFileDir: "./src/service",
  // 生成的mock文件夹
  mockFileDir: "./mock",
  // 是否生成hook方法
  isHook: true,
};

const prettierOptions = {
  tabWidth: 4,
  singleQuote: true,
  trailingComma: "all",
};

// 获取oas文件 // 合并外部文件 // 解除引用
async function getOasJson(oasFilePath) {
  const oasJsonBundle = await SwaggerParser.bundle(oasFilePath);
  const oasJsonDeref = await SwaggerParser.dereference(oasFilePath);
  return { oasJsonBundle, oasJsonDeref };
}

// 清空文件夹
function makeDir(dir) {
  if (!existsSync(dir)) {
    makeDir(path.dirname(dir));
    mkdirSync(dir);
  }
}
function removeDir(dir) {
  glob.sync(`${dir}/**/*`).forEach((ele) => rimraf.sync(ele));
}

function clearDir(dir) {
  removeDir(dir);
  makeDir(dir);
}

// json处理
function requiredSign(list, key) {
  return (list || []).includes(key) ? "" : "?";
}

function resolveNullable(origin, nullable) {
  return (Array.isArray(origin) ? origin : [origin])
    .concat(nullable ? ["null"] : [])
    .join(" | ");
}

function getDataTypes(schemaObject) {
  //   export interface SchemaObject extends ISpecificationExtension {
  //     nullable?: boolean;
  //     discriminator?: DiscriminatorObject;
  //     readOnly?: boolean;
  //     writeOnly?: boolean;
  //     xml?: XmlObject;
  //     externalDocs?: ExternalDocumentationObject;
  //     example?: any;
  //     examples?: any[];
  //     deprecated?: boolean;

  //     type?: 'integer' | 'number' | 'string' | 'boolean' | 'object' | 'null' | 'array';
  //     format?:
  //         | 'int32'
  //         | 'int64'
  //         | 'float'
  //         | 'double'
  //         | 'byte'
  //         | 'binary'
  //         | 'date'
  //         | 'date-time'
  //         | 'password'
  //         | string;
  //     allOf?: (SchemaObject | ReferenceObject)[];
  //     oneOf?: (SchemaObject | ReferenceObject)[];
  //     anyOf?: (SchemaObject | ReferenceObject)[];
  //     not?: SchemaObject | ReferenceObject;
  //     items?: SchemaObject | ReferenceObject;
  //     properties?: { [propertyName: string]: SchemaObject | ReferenceObject };
  //     additionalProperties?: SchemaObject | ReferenceObject | boolean;
  //     description?: string;
  //     default?: any;

  //     title?: string;
  //     multipleOf?: number;
  //     maximum?: number;
  //     exclusiveMaximum?: boolean;
  //     minimum?: number;
  //     exclusiveMinimum?: boolean;
  //     maxLength?: number;
  //     minLength?: number;
  //     pattern?: string;
  //     maxItems?: number;
  //     minItems?: number;
  //     uniqueItems?: boolean;
  //     maxProperties?: number;
  //     minProperties?: number;
  //     required?: string[];
  //     enum?: any[];
  // }

  if (!schemaObject || typeof schemaObject !== "object") return "any";

  const {
    type,
    nullable,
    required,
    items,
    properties,
    enum: enumAlias,
    allOf,
    oneOf,
    anyOf,
    $ref,
  } = schemaObject;

  if ($ref) {
    return `API.${$ref.replace("#/components/schemas/", "")}`;
  }
  if (oneOf && oneOf.length) {
    return `(${oneOf.map((item) => getDataTypes(item)).join(" | ")})`;
  }
  if (anyOf && anyOf.length) {
    return `(${anyOf.map((item) => getDataTypes(item)).join(" & ")})`;
  }
  if (allOf && allOf.length) {
    return `(${allOf.map((item) => getDataTypes(item)).join(" & ")})`;
  }
  if (
    enumAlias &&
    enumAlias.length &&
    (type === "string" || type === "integer" || type === "number")
  ) {
    return `(${resolveNullable(
      enumAlias.map((item) => JSON.stringify(item)),
      nullable
    )})`;
  }
  if (type === "string") {
    return resolveNullable("string", nullable);
  }
  if (type === "integer" || type === "number") {
    return resolveNullable("number", nullable);
  }
  if (type === "boolean") {
    return "boolean";
  }
  if (type === "null") {
    return "null";
  }
  if (type === "array" && items) {
    return `${getDataTypes(items)}[]`;
  }
  if (type === "object" && properties) {
    const keys = Object.keys(properties);
    if (!keys.length) return "any";
    return `{
                ${keys.map(
                  (key) =>
                    `${key}${requiredSign(required, key)}: ${getDataTypes(
                      properties[key]
                    )}`
                )}
            }`;
  }

  return "any";
}

function resolveParams(parameters) {
  const params = (parameters || [])
    .filter((item) => item.in === "query")
    .map((item) => ({
      ...item,
      type: `${item.name}${item.required ? "" : "?"}: ${getDataTypes(
        item.schema
      )}`,
    }));

  return params.length ? params : undefined;
}

function resolveData(requestBody) {
  const content = (requestBody || {}).content || {};
  const datas = Object.keys(content).map((key) => ({
    contentType: key,
    type: getDataTypes(content[key].schema),
  }));
  return datas[0];
}

function resolveResponses(responses, genType) {
  // 仅支持status 200的返回结果
  const response = (responses || {})["200"] || {};
  const responseType =
    Object.keys(response.content || {})[0] || "application/json";
  const schema = response?.content?.[responseType]?.schema;
  if (genType === "mock") {
    response.mock = JSON.stringify(OpenAPISampler.sample(schema || {}));
  } else {
    response.type = getDataTypes(schema);
    response.responseType = responseType.toLowerCase();
  }
  return response;
}

function getApiJson(oasJson, projectConfig, genType) {
  const { globalRequestConfig } = projectConfig;
  const dictOperation = [
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "head",
    "options",
    "trace",
  ];
  const resultJson = [];
  const oasPaths = oasJson.paths;

  Object.keys(oasPaths).forEach((pathKey) => {
    const pathValue = oasPaths[pathKey];

    Object.keys(pathValue).forEach((operationKey) => {
      const operationValue = pathValue[operationKey];
      const { operationId, parameters, requestBody, responses } =
        operationValue;

      if (dictOperation.includes(operationKey)) {
        const response = resolveResponses(responses, genType);
        if (genType === "mock") {
          resultJson.push({
            name: operationId,
            url: pathKey,
            method: operationKey,
            response,
          });
        } else {
          const params = resolveParams(parameters);
          const data = resolveData(requestBody);
          const contentType = (data || {}).contentType;
          resultJson.push({
            ...operationValue,
            name: operationId,
            url: pathKey,
            method: operationKey,
            params,
            data,
            response,
            contentType:
              contentType === globalRequestConfig?.headers?.["Content-Type"]
                ? undefined
                : contentType,
            responseType: response.responseType.includes("json")
              ? undefined
              : response.responseType,
          });
        }
      }
    });
  });

  return resultJson;
}

function getComponentsJson(oasJson) {
  const oasComponents = (oasJson.components || {}).schemas || {};
  return Object.keys(oasComponents).map((key) => ({
    typeName: key,
    type: getDataTypes(oasComponents[key]),
  }));
}

// 写入文件
function writeFile(filePath, templateName, templateConfig) {
  nunjucks.configure({ autoescape: false });
  const template = readFileSync(
    path.join(__dirname, `./template/${templateName}.njk`),
    "utf8"
  );
  const content = nunjucks.renderString(template, templateConfig);
  const prettierContent = prettier.format(content, {
    ...prettierOptions,
    filepath: filePath,
  });
  writeFileSync(filePath, prettierContent, { encoding: "utf8" });
}

function writeServiceFile(fileDir, oasJson, projectConfig) {
  const {
    importRequest,
    importUseRequest,
    globalRequestConfig,
    globalHookConfig,
    isHook,
  } = projectConfig;

  clearDir(fileDir);

  // service
  const apiJson = getApiJson(oasJson, projectConfig, "service");
  writeFile(path.join(fileDir, "index.ts"), "service", {
    apiJson,
    importRequest,
    importUseRequest,
    globalRequestConfig: JSON.stringify(globalRequestConfig),
    globalHookConfig: JSON.stringify(globalHookConfig),
    isHook,
  });

  // typings
  const componentsJson = getComponentsJson(oasJson);
  writeFile(path.join(fileDir, "index.d.ts"), "service.d", {
    componentsJson,
  });
}

function writeMockFile(fileDir, oasJson, projectConfig) {
  clearDir(fileDir);

  const apiJson = getApiJson(oasJson, projectConfig, "mock");
  apiJson.forEach((api) => {
    writeFile(path.join(fileDir, `${api.name}.mock.ts`), "mock", { api });
  });
}

// 合并配置
function getConfig(customConfig) {
  return lodash.merge(defaultConfig, customConfig);
}

async function generateFile(customConfig) {
  const config = getConfig(customConfig);
  const { oasFilePath, serviceFileDir, mockFileDir } = config;
  const { oasJsonBundle, oasJsonDeref } = await getOasJson(oasFilePath);

  writeServiceFile(serviceFileDir, oasJsonBundle, config);
  writeMockFile(mockFileDir, oasJsonDeref, config);
}

// 生成默认配置文件
function generateConfigFile(dir) {
  makeDir(dir);
  writeFile(path.join(dir, "openapi.config.js"), "config");
  writeFile(path.join(dir, "openapi.json"), "openapi");
}

module.exports = { generateFile, generateConfigFile };
