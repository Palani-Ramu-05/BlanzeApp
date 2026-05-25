import type { SignInDto, SignUpDto, ForgotPasswordDto } from '../types/auth.types'
import { MOCK_CREDENTIALS } from '../../libs/mockAuth'

export const signInInitialValues: SignInDto = {
  email: MOCK_CREDENTIALS.email,
  password: MOCK_CREDENTIALS.password,
  rememberMe: false,
}

export const signUpInitialValues: SignUpDto = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export const forgotPasswordInitialValues: ForgotPasswordDto = {
  email: '',
}
