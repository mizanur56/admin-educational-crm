import { Input as AntInput } from 'antd'
import type { InputProps, InputRef } from 'antd'
import type { PasswordProps } from 'antd/es/input/Password'
import type { SearchProps } from 'antd/es/input/Search'
import type { TextAreaProps } from 'antd/es/input/TextArea'
import type { ComponentType } from 'react'

function mergeClassName(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function TextInput({ className, ...props }: InputProps) {
  return <AntInput className={mergeClassName('ui-input', className)} {...props} />
}

function PasswordInput({ className, ...props }: PasswordProps) {
  return <AntInput.Password className={mergeClassName('ui-input', className)} {...props} />
}

function SearchInput({ className, ...props }: SearchProps) {
  return <AntInput.Search className={mergeClassName('ui-input', className)} {...props} />
}

function TextAreaInput({ className, ...props }: TextAreaProps) {
  return <AntInput.TextArea className={mergeClassName('ui-input', className)} {...props} />
}

type AppInputComponent = ComponentType<InputProps> & {
  Password: typeof PasswordInput
  Search: typeof SearchInput
  TextArea: typeof TextAreaInput
}

const Input = TextInput as AppInputComponent
Input.Password = PasswordInput
Input.Search = SearchInput
Input.TextArea = TextAreaInput

export type { InputProps, InputRef, PasswordProps, SearchProps, TextAreaProps }
export default Input
