import { ExecutionContext, createParamDecorator } from '@nestjs/common'

export const User = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  const user = request.user

  // If data is provided, return the specific property
  // For example: @User('email') will return user.email
  return data ? user?.[data] : user
})
