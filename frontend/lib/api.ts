import axios from "axios"

export const apiPublica = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  //https://tienda-col-ecom-ohio.onrender.com //prod
  //baseURL: "http://127.0.0.1:8000", //local
})

export const apiPrivada = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

apiPrivada.interceptors.request.use(
  async (config) => {

    const { auth } = await import("./firebase")

    const user = auth.currentUser

    if (user) {

      const token =
        await user.getIdToken()

      config.headers.Authorization =
        `Bearer ${token}`
    }

    return config
  }
)

export const api = apiPrivada