module.exports = {
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
