export interface ForgotPassword {
  payload: {
    firstname: string;
    lastname?: string;
    email: string;
    activationToken: string;
  };
  template: string;
}
