import { API_URL, STRAPI_URL } from '@/constants'


type CustomFetchType = {
  path: string
  token?: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: object,
  params?: string | URLSearchParams | Record<string, string> | string[][] | any
  headers?: Record<string, string>
  strapi?: boolean
}

type CustomFetchResponse = {
  response: Response,
  ok: boolean,
  data: any
}

type FetchOptionsType = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  headers: Headers,
  body?: string | FormData,
}


export const customFetch = async ({
  path,
  token,
  method,
  body,
  params,
  headers = { 'Content-Type': 'application/json' },
  strapi = false
}: CustomFetchType): Promise<CustomFetchResponse> => {
  const urlPath = new URL(`${path}`, strapi ? STRAPI_URL : API_URL)
  if (params) urlPath.search = new URLSearchParams(params).toString()

  const requestHeaders = new Headers(headers)
  if (token) requestHeaders.append('Authorization', `Token ${token}`)

  const fetchOptions: FetchOptionsType = {
    method,
    headers: requestHeaders,
    body: undefined,
  }

  if(body && !(body instanceof FormData)) fetchOptions.body = JSON.stringify(body)
  else fetchOptions.body = body

  try {
    const response = await fetch(urlPath.toString(), fetchOptions)

    if (response.status === 401) deleteInvalidToken()

    let data: any = null
    if (response.status !== 204)
      data = await response.json()

    if(strapi && Object.keys(data.meta).length === 0) {
      delete data.meta
      data = data?.data
    }

    return {
      response,
      ok: response.ok,
      data
    }
  } catch (error) {
    return handleError(error, requestHeaders)
  }
}


const deleteInvalidToken = () => {
  localStorage.removeItem('token')
  window.dispatchEvent(new Event('storage'))
}

const handleError = (error: unknown, headers: Headers) => {
  const response = new Response('Something went wrong', {
    status: 500,
    headers,
  })

  if (error) {
    return {
      response,
      ok: false,
      data: error
    }
  }

  return {
    response,
    ok: false,
    data: `Something went wrong, error ${JSON.stringify(error)}`
  }
}


