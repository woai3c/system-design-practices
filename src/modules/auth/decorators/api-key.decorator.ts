import { SetMetadata } from '@nestjs/common'

export const ALLOW_API_KEY = 'allowApiKey'
export const AllowApiKey = () => SetMetadata(ALLOW_API_KEY, true)
