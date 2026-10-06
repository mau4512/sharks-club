'use client'

import { useId, useState, type ChangeEvent } from 'react'

interface SelectEditableProps {
  label: string
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void
}

export function SelectEditable({ label, name, value, options, onChange }: SelectEditableProps) {
  const id = useId()
  const [personalizado, setPersonalizado] = useState(false)
  const customOption = '__personalizar__'
  const className = 'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900'

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        id={id}
        name={name}
        value={personalizado ? customOption : value}
        onChange={(event) => {
          if (event.target.value === customOption) {
            setPersonalizado(true)
          } else {
            setPersonalizado(false)
            onChange(event)
          }
        }}
        className={className}
      >
        {!options.some((option) => option.value === value) && <option value={value}>{value || 'Seleccionar'}</option>}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        <option value={customOption}>Escribir otra opción…</option>
      </select>
      {personalizado && (
        <div className="mt-2">
          <label htmlFor={`${id}-custom`} className="block text-sm font-medium text-gray-700 mb-1">{label} personalizado</label>
          <input id={`${id}-custom`} name={name} value={value} onChange={onChange} className={className} required autoFocus />
        </div>
      )}
    </div>
  )
}
