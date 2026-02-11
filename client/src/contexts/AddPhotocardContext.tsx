import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

interface AddPhotocardContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const AddPhotocardContext = createContext<AddPhotocardContextValue | null>(null)

export function AddPhotocardProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  return (
    <AddPhotocardContext.Provider value={{ isOpen, open, close }}>
      {children}
    </AddPhotocardContext.Provider>
  )
}

export function useAddPhotocard() {
  const ctx = useContext(AddPhotocardContext)
  if (!ctx) {
    throw new Error('useAddPhotocard must be used within AddPhotocardProvider')
  }
  return ctx
}
