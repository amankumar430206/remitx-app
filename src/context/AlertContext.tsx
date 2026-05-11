import React, { createContext, useContext, useState, useCallback } from 'react'
import { AlertDialog, type AlertButton } from '@/components/ui/AlertDialog'

interface AlertConfig {
  title: string
  message?: string
  buttons: AlertButton[]
}

interface AlertContextValue {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void
}

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null)

  const showAlert = useCallback((
    title: string,
    message?: string,
    buttons?: AlertButton[],
  ) => {
    setConfig({
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: 'OK', style: 'default' }],
    })
  }, [])

  const dismiss = useCallback(() => setConfig(null), [])

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {config && (
        <AlertDialog
          visible
          title={config.title}
          message={config.message}
          buttons={config.buttons}
          onDismiss={dismiss}
        />
      )}
    </AlertContext.Provider>
  )
}

export function useAlertContext() {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlertContext must be used inside AlertProvider')
  return ctx
}
