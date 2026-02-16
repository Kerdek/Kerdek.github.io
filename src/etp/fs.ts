
export const valid_filename = (name: string) =>
/^[^\0\/]+$/.test(name) && name !== '.' && name !== '..'

export type FakeFile = {
  contents: string }

export const files: { [i in string]: FakeFile } = (() => {
const text = localStorage.getItem('semity_files')
return text ? JSON.parse(text) : {} })()

const files_changed_listeners: Set<() => void> =
new Set()

export const add_files_changed_listener = (handler: () => void): void => {
files_changed_listeners.add(handler) }

export const remove_files_changed_listener = (handler: () => void): void => {
files_changed_listeners.delete(handler) }

export const files_changed = (): void => {
localStorage.setItem('semity_files', JSON.stringify(files))
for (const handler of files_changed_listeners) {
  handler() } }
