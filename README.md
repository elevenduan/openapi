# openapi

唯一 openapi 规范说明，生成 service、mock、typings 文件。

## 默认配置

```配置说明
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
```

## 使用方式

- `npm install @bigflower/openapi --save-dev`
- 项目文件 package.json > scripts，添加`"openapi": "openapi"`
- 终端执行`npm run openapi init`，生成/openapi/openapi.config.js、/openapi/openapi.json
  - 切勿重复执行，会覆盖之前已有文件
  - config.js 文件修改配置，json 文件修改 api 文档
- 终端执行`npm run openapi`，根据配置和文档，生成 service、mock 文件

## 参考文档

- [OpenAPI Guide](https://swagger.io/docs/specification/about/)
- [Axios Request Config](https://axios-http.com/docs/req_config)
- [ahooks useRequest Config](https://ahooks.js.org/hooks/async#basic-api)
- [Faker Api Methods](https://github.com/Marak/Faker.js#api-methods)
- [Mock Wiki](https://github.com/nuysoft/Mock/wiki)
