# openapi

唯一 openapi 规范说明，生成 services、mocks、typings 文件。

## 默认配置

```配置说明
module.exports = {
  // import service方法，默认axios
  // import hook方法，默认ahooks useRequest。需同时配置isHook为true。
  // type Response，自行修改。其他自定义语句，可直接写入。
  importStatement: `
      import request, {AxiosPromise} from 'axios';
      import {useRequest} from 'ahooks';

      type Response<T> = AxiosPromise<{
          resCode: string;
          resMsg: string;
          data: T;
      }>;
  `,
  // 全局request配置，参考axios配置项。
  globalRequestConfig: {headers: {'Content-Type': 'application/json'}},
  // 全局hook配置，默认手动。改为自动时参数传递方式：参数{defaultParams: [data[, config]]}
  globalHookConfig: {manual: true},
  // OpenAPI Specification描述文件路径，支持json、yaml格式。支持本地文件引用、内部schema引用、外部链接引用。
  oasFilePath: './openapi/openapi.json',
  // 生成的service文件夹
  serviceFileDir: './src/service',
  // 生成的mock文件夹
  mockFileDir: './mock',
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
- 添加[VS Code Extension](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi)，预览编辑 openapi.json

## 参考文档

- [OpenAPI Guide](https://swagger.io/docs/specification/about/)
- [Axios Request Config](https://axios-http.com/docs/req_config)
- [ahooks useRequest Config](https://ahooks.js.org/hooks/async#basic-api)
- [Faker Api Methods](https://github.com/Marak/Faker.js#api-methods)
- [Mock Wiki](https://github.com/nuysoft/Mock/wiki)

## 数据样例

```api json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "format": "int64",
      "example": 10
    },
    "shipDate": {
      "type": "string",
      "format": "date-time"
    },
    "status": {
      "type": "string",
      "example": "approved",
      "enum": ["placed", "approved", "delivered"]
    },
    "complete": {
      "type": "boolean"
    },
    "list": {
      "type": "array",
      "items": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "minItems": 1,
        "maxItems": 3
      },
      "minItems": 1,
      "maxItems": 2
    },
    "uuid": {
      "type": "string",
      "x-faker": "datatype.uuid"
    },
    "city": {
      "type": "string",
      "x-mock": "Random.city"
    },
    "url": {
      "type": "string",
      "x-mock": {
        "Random.url": "http"
      }
    }
  }
}
```

```api mock
{
  "uuid": "52b31f6f-0fd5-474d-bf95-94c6ffeb56cc",
  "shipDate": "1947-12-06T16:00:00.0Z",
  "url": "http://mrbae.kr/piwhseneh",
  "complete": false,
  "list": [
    ["cillum incididunt ad proident", "Ut", "aute tempor aliqua ut"],
    ["fugiat reprehenderit", "nostrud", "dolor"]
  ],
  "status": "approved",
  "id": 10,
  "city": "宜春市"
}
```
