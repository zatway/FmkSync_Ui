import {BaseQueryFn} from '@reduxjs/toolkit/query'
import type {AxiosRequestConfig, AxiosError} from 'axios'

import axios from 'axios'
import { env } from '@/env'
import { authLocalService } from '@/shared/lib/localStorageService/authLocalService'

export const axiosInstance = axios.create({
    baseURL: `${env.VITE_API_BASE_URL}/api/v1`,
    timeout: 30000,
    headers: {
        Accept: 'application/json',
    },
})

axiosInstance.interceptors.request.use(config => {
    const token = authLocalService.getToken()

    if (token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${token}`
    }

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        if (config.headers) {
            delete config.headers['Content-Type']
        }
    } else {
        config.headers = config.headers ?? {};
        config.headers['Content-Type'] = 'application/json'
    }

    return config
})

type AxiosBaseQueryArgs = {
    url: string
    method?: AxiosRequestConfig['method']
    data?: AxiosRequestConfig['data']
    params?: AxiosRequestConfig['params']
    responseType?: AxiosRequestConfig['responseType']
}

export type AxiosBaseQueryError = {
    status?: number
    data:
        | { detail?: string; }
}// объект с detail

export const axiosBaseQuery =
    (): BaseQueryFn<AxiosBaseQueryArgs, unknown, AxiosBaseQueryError> =>
        async ({url, method = 'GET', data, params, responseType}) => {
            try {
                const result = await axiosInstance({
                    url,
                    method,
                    data,
                    params,
                    responseType,
                })

                return {
                    data: result.data,
                }
            } catch (err) {
                const error = err as AxiosError

                const reqUrl = (error.config?.url ?? "").toLowerCase()
                const isAuthAnonymousRequest =
                    reqUrl.includes("/auth/login") ||
                    reqUrl.includes("/auth/register") ||
                    reqUrl.includes("/auth/forgot-password") ||
                    reqUrl.includes("/auth/reset-password") ||
                    reqUrl.includes("/auth/refresh")

                if (error.response?.status === 401 && !isAuthAnonymousRequest) {
                    authLocalService.clearTokenData()
                    window.location.replace(env.ROUTE_LOGIN)
                }

                return {
                    error: {
                        status: error.response?.status,
                        data: error.response?.data ?? error.message,
                    },
                }
            }
        }
