import {useEffect, useState} from 'react'

type Value = string | null

/**
 * @internal
 *
 */
function useLocalStorage(key: string): Value {
    const readValue = (): Value => {
        if (typeof window === 'undefined') {
            return null
        }

        return window.localStorage.getItem(key)
    }

    const [storedValue, setStoredValue] = useState<Value>(readValue)

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key !== key) {
            return
        }
        setStoredValue(readValue())
    }

    useEffect(() => {
        window.addEventListener('storage', handleStorageChange)

        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    return storedValue
}

export default useLocalStorage
