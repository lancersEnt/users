export interface PasswordChanged {
  payload: {
    firstname: string;
    lastname?: string;
    email: string;
  };
  template: string;
}
