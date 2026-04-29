export const isTransientWriteConflict = (error: unknown): boolean => {
  if (!error) return false

  const message = error instanceof Error ? error.message : String(error)

  return (
    message.includes('Write conflict') ||
    message.includes('TransientTransactionError') ||
    message.includes('Please retry your operation')
  )
}

export const retryTransientWrite = async <T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> => {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (!isTransientWriteConflict(error) || attempt === maxAttempts) {
        throw error
      }

      const waitMs = attempt * 200
      await new Promise(resolve => setTimeout(resolve, waitMs))
    }
  }

  throw lastError
}
