import { AxiosRequestConfig } from 'axios';

import { AdapterConfig } from '../types';

export function configureAuth(
  axiosConfig: AxiosRequestConfig,
  adapterConfig: AdapterConfig,
): AxiosRequestConfig {
  if (!adapterConfig.auth) {
    return axiosConfig;
  }

  const { auth } = adapterConfig;

  switch (auth.type) {
    case 'bearer':
      axiosConfig.headers = {
        ...axiosConfig.headers,
        Authorization: `Bearer ${auth.credentials['token']}`,
      };
      break;
    case 'basic': {
      const { username, password } = auth.credentials;
      axiosConfig.auth = { username, password };
      break;
    }
    case 'api-key': {
      const { key, headerName = 'X-API-Key' } = auth.credentials;
      axiosConfig.headers = {
        ...axiosConfig.headers,
        [headerName]: key,
      };
      break;
    }
  }

  return axiosConfig;
}
