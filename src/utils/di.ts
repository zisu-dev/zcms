import { E_NOT_FOUND } from './errors'

interface InjectInfo<T> {
  provider: () => Promise<T>
  value: T | undefined
  executed: boolean
  callbacks: {
    resolve: (value: T) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason: any) => void
  }[]
}

export class DI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static infos = new Map<symbol, InjectInfo<any>>()

  static step<T>(key: symbol, provider: () => Promise<T>): void {
    this.infos.set(key, {
      provider,
      value: undefined,
      executed: false,
      callbacks: []
    })
  }

  static waitFor<T>(key: symbol): Promise<T> {
    const info: InjectInfo<T> | undefined = this.infos.get(key)
    if (!info) {
      throw new Error(E_NOT_FOUND)
    } else {
      const promise = new Promise<T>((resolve, reject) => {
        if (info.value) {
          resolve(info.value)
        } else {
          info.callbacks.push({ resolve, reject })
        }
      })
      if (!info.executed) {
        info.executed = true
        info
          .provider()
          .then((v) => {
            info.value = v
            info.callbacks.forEach(({ resolve }) => resolve(v))
          })
          .catch((e) => {
            info.callbacks.forEach(({ reject }) => reject(e))
          })
      }
      return promise
    }
  }
}
