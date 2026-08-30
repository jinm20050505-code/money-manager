export const REQUIRED_MESSAGE = '※この項目は入力必須です'
export const INVALID_CHAR_MESSAGE = 'この文字は、入力もできません'
export const MAX_DISPLAY_LENGTH = 400

const INVALID_CHAR_PATTERN = /[<>]/

export function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === ''
}

export function hasInvalidChars(value) {
  return typeof value === 'string' && INVALID_CHAR_PATTERN.test(value)
}
