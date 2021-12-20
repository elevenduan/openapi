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
  globalRequestConfig: { headers: { 'Content-Type': 'application/json' } },
  // 全局hook配置，默认手动。改为自动时参数传递方式：参数{defaultParams: [data[, config]]}
  globalHookConfig: { manual: true },
  // OpenAPI Specification描述文件路径，支持json、yaml格式。支持本地文件引用、内部schema引用、外部链接引用。
  oasFilePath: './openapi/openapi.json',
  // 生成的service文件夹
  serviceFileDir: './src/services',
  // 生成的mock文件夹
  mockFileDir: './mock',
  // 是否生成hook方法
  isHook: true
};
