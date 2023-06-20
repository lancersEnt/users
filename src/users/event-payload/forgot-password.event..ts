export interface ForgotPassword {
  payload: {
    firstname: string;
    lastname?: string;
    email: string;
    passwordReset: string;
  };
  template: string;
}
